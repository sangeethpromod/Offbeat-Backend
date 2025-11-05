import { Request, Response, NextFunction } from 'express';
import { auth } from '../Config/firebase';
import { FirebaseUser } from '../Types';
import AuthUser from '../Model/authModel';
import Role from '../Model/roleModel';
import {
  trackFirebaseAuth,
  trackDatabaseOperation,
  trackError,
} from '../Utils/newrelicInstrumentation';

/**
 * Firebase Token Verification Middleware
 *
 * This middleware:
 * - Reads Bearer token from req.headers.authorization
 * - Verifies Firebase token using Admin SDK
 * - Attaches decoded user info to req.user
 */
export const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No valid authorization token provided',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format',
      });
      return;
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user info to request object
    const firebaseUser: FirebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || undefined,
      name: decodedToken.name || undefined,
      picture: decodedToken.picture || undefined,
      email_verified: decodedToken.email_verified || undefined,
    };

    req.user = firebaseUser;

    // Track successful Firebase authentication
    trackFirebaseAuth('verify_token', firebaseUser.uid, true, {
      email: firebaseUser.email,
      hasName: !!firebaseUser.name,
      emailVerified: firebaseUser.email_verified,
    });

    // Ensure an AuthUser exists in MongoDB for this Firebase user
    try {
      const startTime = Date.now();
      const defaultRole = process.env.DEFAULT_ROLE || 'traveller';

      // Try to find by firebaseUid first, then by email
      let userDoc = await AuthUser.findOne({
        $or: [
          { firebaseUid: firebaseUser.uid },
          ...(firebaseUser.email ? [{ email: firebaseUser.email }] : []),
        ],
      });

      if (!userDoc) {
        // Prefer ACTIVE default role, but don't block provisioning if role record missing
        const roleDoc = await Role.findOne({
          roleName: defaultRole,
          roleStatus: 'ACTIVE',
        });
        if (!roleDoc) {
          console.warn(
            `Default role "${defaultRole}" not found or inactive. Proceeding to auto-provision user ${firebaseUser.uid} with role string only.`
          );
        }

        // Create new AuthUser document
        userDoc = new AuthUser({
          fullName:
            firebaseUser.name ||
            (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          email: firebaseUser.email || `${firebaseUser.uid}@placeholder.local`,
          role: defaultRole,
          firebaseUid: firebaseUser.uid,
        });
        await userDoc.save();

        const duration = Date.now() - startTime;
        trackDatabaseOperation('create', 'AuthUser', duration, true);
        trackFirebaseAuth('auto_provision', firebaseUser.uid, true, {
          role: defaultRole,
          email: firebaseUser.email,
        });

        console.info(
          `Auto-provisioned AuthUser for Firebase UID ${firebaseUser.uid}`
        );
      } else if (!userDoc.firebaseUid) {
        // Backfill missing firebaseUid
        userDoc.firebaseUid = firebaseUser.uid;
        await userDoc.save();

        const duration = Date.now() - startTime;
        trackDatabaseOperation('update', 'AuthUser', duration, true);

        console.info(`Backfilled firebaseUid for user ${userDoc.email}`);
      } else {
        const duration = Date.now() - startTime;
        trackDatabaseOperation('find', 'AuthUser', duration, true);
      }
    } catch (provisionErr) {
      console.error('Auto-provisioning AuthUser failed:', provisionErr);
      trackError(provisionErr as Error, {
        operation: 'auto_provision',
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
      });
      // Do not block the request purely due to provisioning failure
    }

    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);

    // Track authentication failure
    trackFirebaseAuth('verify_token', 'unknown', false, {
      error: (error as Error).message,
      errorCode: (error as any).code,
    });

    trackError(error as Error, {
      operation: 'firebase_token_verification',
      authHeader: !!req.headers.authorization,
    });

    // Handle specific Firebase Auth errors
    const firebaseError = error as any;
    if (firebaseError.code === 'auth/id-token-expired') {
      res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
      return;
    }

    if (firebaseError.code === 'auth/id-token-revoked') {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
