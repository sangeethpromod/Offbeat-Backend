import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateTokens } from '../../Middleware/tokenManagement';
import { auth } from '../../Config/firebase';
import transporter from '../../Config/email';
import AuthUser from '../../Model/authModel';
import HostProfile from '../../Model/hostModel';
import Role from '../../Model/roleModel';
import {
  RegisterUserRequest,
  LoginRequest,
  GoogleLoginRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ApiResponse,
  LoginResponse,
  GoogleLoginResponse,
} from '../../Types';
import newrelic from 'newrelic';

/**
 * Register a new user (traveller or admin) with Firebase Authentication
 */
export const registerUser = async (
  req: Request<{}, ApiResponse, RegisterUserRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
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
    if (role !== 'traveller' && role !== 'admin' && role !== 'host') {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be either "traveller" or "admin"',
      });
      return;
    }

    // Check if role exists and is ACTIVE
    const roleDoc = await Role.findOne({
      roleName: role,
      roleStatus: 'ACTIVE',
    });
    if (!roleDoc) {
      res.status(400).json({
        success: false,
        message: 'Invalid role or role is not active',
      });
      return;
    }

    // Check if user already exists in our database
    const existingUser = await AuthUser.findOne({ email });
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

    const savedUser = await newUser.save();

    // Generate custom Firebase token for immediate login
    const firebaseToken = await auth.createCustomToken(firebaseUser.uid);

    // Generate access/refresh tokens for our app
    const { accessToken, refreshToken } = await generateTokens({
      userId: savedUser.userId,
      email: savedUser.email,
      role: savedUser.role,
      fullName: savedUser.fullName,
    });

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

    // Check host status if user is a host
    if (user.role === 'host') {
      const hostProfile = await HostProfile.findOne({ userId: user.userId });
      if (hostProfile) {
        if (hostProfile.status === 'BLOCKED') {
          res.status(403).json({
            success: false,
            message:
              'You are blocked due to not following our guidelines. Please contact support.',
          });
          return;
        }

        if (hostProfile.status === 'REJECTED') {
          const rejectedAt = hostProfile.rejectedAt;
          if (rejectedAt) {
            const tenDaysInMs = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
            const now = Date.now();
            const timeSinceRejection = now - rejectedAt.getTime();

            if (timeSinceRejection < tenDaysInMs) {
              const remainingDays = Math.ceil(
                (tenDaysInMs - timeSinceRejection) / (24 * 60 * 60 * 1000)
              );
              res.status(403).json({
                success: false,
                message: `You cannot login with this ID for ${remainingDays} more days due to rejection.`,
              });
              return;
            } else {
              // More than 10 days have passed, allow login and reset status to PENDING
              hostProfile.status = 'PENDING';
              hostProfile.rejectReason = null;
              hostProfile.rejectedAt = null;
              await hostProfile.save();
            }
          } else {
            // No rejectedAt timestamp, treat as still rejected
            res.status(403).json({
              success: false,
              message:
                'You cannot login with this ID for 10 days due to rejection.',
            });
            return;
          }
        }
      }
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
          ...(user.firebaseUid && { firebaseUid: user.firebaseUid }),
        },
        token: accessToken,
        accessToken,
        refreshToken,
        firebaseToken,
      },
    });

    // Log successful authentication
    newrelic.recordCustomEvent('AuthenticationEvent', {
      eventType: 'login_success',
      userId: user.userId,
      method: 'email_password',
      duration: Date.now() - startTime,
    });
  } catch (error) {
    // Log authentication failures
    newrelic.recordCustomEvent('AuthenticationEvent', {
      eventType: 'login_failure',
      email: req.body.email,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    newrelic.noticeError(
      error instanceof Error ? error : new Error(String(error))
    );

    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Google Sign-In Authentication
 * Frontend sends Firebase ID token after Google Sign-In
 */
export const googleLogin = async (
  req: Request<{}, ApiResponse<GoogleLoginResponse>, GoogleLoginRequest>,
  res: Response<ApiResponse<GoogleLoginResponse>>
): Promise<void> => {
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
    let user = await AuthUser.findOne({
      $or: [{ email }, { firebaseUid: uid }],
    });

    if (user) {
      // User exists, update Firebase UID if not set
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
      }
    } else {
      // User doesn't exist, create new user with default 'traveller' role
      // NOTE: Firebase-created users are ALWAYS 'traveller' - never 'admin'
      const defaultRole = 'traveller';

      // Verify the default role exists and is active
      const roleDoc = await Role.findOne({
        roleName: defaultRole,
        roleStatus: 'ACTIVE',
      });

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

      await user.save();
    }

    // Check host status if user is a host
    if (user.role === 'host') {
      const hostProfile = await HostProfile.findOne({ userId: user.userId });
      if (hostProfile) {
        if (hostProfile.status === 'BLOCKED') {
          res.status(403).json({
            success: false,
            message:
              'You are blocked due to not following our guidelines. Please contact support.',
          });
          return;
        }

        if (hostProfile.status === 'REJECTED') {
          const rejectedAt = hostProfile.rejectedAt;
          if (rejectedAt) {
            const tenDaysInMs = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
            const now = Date.now();
            const timeSinceRejection = now - rejectedAt.getTime();

            if (timeSinceRejection < tenDaysInMs) {
              const remainingDays = Math.ceil(
                (tenDaysInMs - timeSinceRejection) / (24 * 60 * 60 * 1000)
              );
              res.status(403).json({
                success: false,
                message: `You cannot login with this ID for ${remainingDays} more days due to rejection.`,
              });
              return;
            } else {
              // More than 10 days have passed, allow login and reset status to PENDING
              hostProfile.status = 'PENDING';
              hostProfile.rejectReason = null;
              hostProfile.rejectedAt = null;
              await hostProfile.save();
            }
          } else {
            // No rejectedAt timestamp, treat as still rejected
            res.status(403).json({
              success: false,
              message:
                'You cannot login with this ID for 10 days due to rejection.',
            });
            return;
          }
        }
      }
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
    console.error('Error during Google login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Re-export the Firebase token verification middleware
export { verifyFirebaseToken } from '../../Middleware/firebaseAuth';

/**
 * Request Password Reset - sends reset code to email
 */
export const requestPasswordReset = async (
  req: Request<{}, ApiResponse, RequestPasswordResetRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    const user = await AuthUser.findOne({ email, isActive: true });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Generate 6-digit numeric reset code
    const resetCode = crypto.randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetCode = resetCode;
    user.resetCodeExpiry = expiry;
    await user.save();

    // Send email
    const subject = 'Password Reset Code';
    const text = `Your password reset code is: ${resetCode}. It expires in 10 minutes.`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text,
      });

      res.json({
        success: true,
        message: 'Reset code sent to your email',
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send reset email',
      });
    }
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Reset Password using code
 */
export const resetPassword = async (
  req: Request<{}, ApiResponse, ResetPasswordRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, code, and new password are required',
      });
      return;
    }

    const user = await AuthUser.findOne({ email, isActive: true });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (
      !user.resetCode ||
      user.resetCode !== code ||
      !user.resetCodeExpiry ||
      user.resetCodeExpiry < new Date()
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code',
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Change Password (Hard Reset) - requires old password verification
 */
export const changePassword = async (
  req: Request<{}, ApiResponse, ChangePasswordRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Old password and new password are required',
      });
      return;
    }

    // Get user from middleware (assuming verifyFirebaseToken or similar sets req.user)
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await AuthUser.findOne({ userId, isActive: true });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'No password set for this account',
      });
      return;
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid old password',
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
