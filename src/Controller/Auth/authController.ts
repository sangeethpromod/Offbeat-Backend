import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateTokens } from '../../Middleware/tokenManagement';
import { auth } from '../../Config/firebase';
import AuthUser from '../../Model/authModel';
import Role from '../../Model/roleModel';
import {
  RegisterUserRequest,
  LoginRequest,
  GoogleLoginRequest,
  ApiResponse,
  LoginResponse,
  GoogleLoginResponse,
} from '../../Types';
import {
  trackFirebaseAuth,
  trackDatabaseOperation,
  trackError,
  trackBusinessMetric,
} from '../../Utils/newrelicInstrumentation';

export const registerUser = async (
  req: Request<{}, ApiResponse, RegisterUserRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  const startTime = Date.now();

  try {
    const { fullName, email, password, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: fullName, email, password, role',
      });
      return;
    }

    // Validate role - only allow 'traveller' or 'admin' (case sensitive)
    if (role !== 'traveller' && role !== 'admin') {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be either "traveller" or "admin"',
      });
      return;
    }

    // Check if role exists and is ACTIVE
    const roleStartTime = Date.now();
    const roleDoc = await Role.findOne({
      roleName: role,
      roleStatus: 'ACTIVE',
    });
    trackDatabaseOperation(
      'find',
      'Role',
      Date.now() - roleStartTime,
      !!roleDoc
    );

    if (!roleDoc) {
      res.status(400).json({
        success: false,
        message: 'Invalid role or role is not active',
      });
      return;
    }

    // Check if user already exists in our database
    const userCheckStartTime = Date.now();
    const existingUser = await AuthUser.findOne({ email });
    trackDatabaseOperation(
      'find',
      'AuthUser',
      Date.now() - userCheckStartTime,
      true
    );

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email,
        password,
        displayName: fullName,
        emailVerified: false, // User can verify email later
      });
    } catch (firebaseError: any) {
      console.error('Firebase user creation error:', firebaseError);

      trackFirebaseAuth('register', 'unknown', false, {
        email,
        role,
        error: firebaseError.message,
        errorCode: firebaseError.code,
      });

      if (firebaseError.code === 'auth/email-already-exists') {
        res.status(400).json({
          success: false,
          message: 'Email is already registered',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create user account',
      });
      return;
    }

    // Hash password for local storage (backup)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user in our database
    const newUser = new AuthUser({
      fullName,
      email,
      password: hashedPassword,
      role,
      firebaseUid: firebaseUser.uid,
    });

    const saveStartTime = Date.now();
    const savedUser = await newUser.save();
    trackDatabaseOperation(
      'create',
      'AuthUser',
      Date.now() - saveStartTime,
      true
    );

    // Generate custom Firebase token for immediate login
    const firebaseToken = await auth.createCustomToken(firebaseUser.uid);

    // Generate access/refresh tokens for our app
    const { accessToken, refreshToken } = await generateTokens({
      userId: savedUser.userId,
      email: savedUser.email,
      role: savedUser.role,
      fullName: savedUser.fullName,
    });

    const totalDuration = Date.now() - startTime;
    trackFirebaseAuth('register', savedUser.userId, true, {
      email,
      role,
      duration: totalDuration,
    });

    trackBusinessMetric('user_registration', 1, { role });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      data: {
        user: {
          userId: savedUser.userId,
          fullName: savedUser.fullName,
          email: savedUser.email,
          role: savedUser.role,
          firebaseUid: firebaseUser.uid,
        },
        token: accessToken,
        accessToken,
        refreshToken,
        firebaseToken,
      },
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    trackError(error as Error, {
      operation: 'user_registration',
      email: req.body.email,
      role: req.body.role,
      duration: totalDuration,
    });

    console.error('Error registering traveller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Login user using Firebase Authentication
 */
export const login = async (
  req: Request<{}, ApiResponse<LoginResponse>, LoginRequest>,
  res: Response<ApiResponse<LoginResponse>>
): Promise<void> => {
  const startTime = Date.now();

  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find user in our database
    const user = await AuthUser.findOne({ email, isActive: true });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user has a password (hosts might not have password until step 2)
    if (!user.password) {
      res.status(401).json({
        success: false,
        message:
          'Account setup is incomplete. Please complete your registration.',
      });
      return;
    }

    // Verify password against local hash (backup verification)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate custom Firebase token for the user
    let firebaseToken: string;
    try {
      if (user.firebaseUid) {
        // User has Firebase UID, create custom token
        firebaseToken = await auth.createCustomToken(user.firebaseUid);
      } else {
        // User doesn't have Firebase UID yet, create Firebase user
        const firebaseUser = await auth.createUser({
          email: user.email,
          displayName: user.fullName,
          emailVerified: false,
        });

        // Update our user record with Firebase UID
        user.firebaseUid = firebaseUser.uid;
        await user.save();

        firebaseToken = await auth.createCustomToken(firebaseUser.uid);
      }
    } catch (firebaseError: any) {
      console.error('Firebase token generation error:', firebaseError);

      // Continue with JWT-only authentication if Firebase fails
      const jwtToken = jwt.sign(
        {
          userId: user.userId,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful (limited features)',
        data: {
          user: {
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
          token: jwtToken,
        },
      });
      return;
    }

    // Generate access/refresh tokens for our app
    const { accessToken, refreshToken } = await generateTokens({
      userId: user.userId,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          firebaseUid: user.firebaseUid,
        },
        token: accessToken,
        accessToken,
        refreshToken,
        firebaseToken,
      },
    });

    // Log successful authentication
    trackFirebaseAuth('login', user.userId, true, {
      method: 'email_password',
      duration: Date.now() - startTime,
      hasFirebaseUid: !!user.firebaseUid,
    });

    trackBusinessMetric('user_login', 1, { method: 'email_password' });
  } catch (error) {
    // Log authentication failures
    trackFirebaseAuth('login', 'unknown', false, {
      email: req.body.email,
      method: 'email_password',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    });

    trackError(error instanceof Error ? error : new Error(String(error)), {
      operation: 'user_login',
      email: req.body.email,
      method: 'email_password',
    });

    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const googleLogin = async (
  req: Request<{}, ApiResponse<GoogleLoginResponse>, GoogleLoginRequest>,
  res: Response<ApiResponse<GoogleLoginResponse>>
): Promise<void> => {
  const startTime = Date.now();

  try {
    // Accept token from body, query, or Authorization header for flexibility
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split('Bearer ')[1]
        : undefined;
    const idToken =
      req.body?.idToken || (req as any).query?.idToken || bearerToken;

    // Validate required fields
    if (!idToken) {
      res.status(400).json({
        success: false,
        message: 'Firebase ID token is required',
      });
      return;
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (firebaseError: any) {
      console.error('Firebase token verification error:', firebaseError);

      trackFirebaseAuth('google_login', 'unknown', false, {
        error: firebaseError.message,
        errorCode: firebaseError.code,
      });

      res.status(401).json({
        success: false,
        message: 'Invalid or expired Firebase token',
      });
      return;
    }

    const { uid, email, name } = decodedToken;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required for account creation',
      });
      return;
    }

    // Check if user exists in our database
    const userCheckStartTime = Date.now();
    let user = await AuthUser.findOne({
      $or: [{ email }, { firebaseUid: uid }],
    });
    trackDatabaseOperation(
      'find',
      'AuthUser',
      Date.now() - userCheckStartTime,
      true
    );

    if (user) {
      // User exists, update Firebase UID if not set
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        const updateStartTime = Date.now();
        await user.save();
        trackDatabaseOperation(
          'update',
          'AuthUser',
          Date.now() - updateStartTime,
          true
        );
      }
    } else {
      // User doesn't exist, create new user with default 'traveller' role
      // NOTE: Firebase-created users are ALWAYS 'traveller' - never 'admin'
      const defaultRole = 'traveller';

      // Verify the default role exists and is active
      const roleCheckStartTime = Date.now();
      const roleDoc = await Role.findOne({
        roleName: defaultRole,
        roleStatus: 'ACTIVE',
      });
      trackDatabaseOperation(
        'find',
        'Role',
        Date.now() - roleCheckStartTime,
        !!roleDoc
      );

      if (!roleDoc) {
        res.status(500).json({
          success: false,
          message: 'Default role configuration error',
        });
        return;
      }

      user = new AuthUser({
        fullName: name || email.split('@')[0], // Use name or email prefix
        email,
        role: defaultRole, // Always 'traveller' for Firebase users
        firebaseUid: uid,
        // No password needed for Google sign-in users
      });

      const createStartTime = Date.now();
      await user.save();
      trackDatabaseOperation(
        'create',
        'AuthUser',
        Date.now() - createStartTime,
        true
      );

      trackFirebaseAuth('google_register', user.userId, true, {
        email,
        name,
        duration: Date.now() - startTime,
      });

      trackBusinessMetric('user_registration', 1, { method: 'google' });
    }

    // Generate JWT token for our app
    const jwtToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
        firebaseUid: uid,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    const totalDuration = Date.now() - startTime;
    trackFirebaseAuth('google_login', user.userId, true, {
      email,
      duration: totalDuration,
      userExisted: !!user.createdAt,
    });

    trackBusinessMetric('user_login', 1, { method: 'google' });

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          firebaseUid: uid,
        },
        token: jwtToken,
        firebaseToken: idToken, // Return the original token
      },
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    trackError(error as Error, {
      operation: 'google_login',
      duration: totalDuration,
    });

    console.error('Error during Google login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Re-export the Firebase token verification middleware
export { verifyFirebaseToken } from '../../Middleware/firebaseAuth';
