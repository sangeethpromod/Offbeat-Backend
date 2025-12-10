import { Router } from 'express';
import {
  registerUser,
  login,
  googleLogin,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from '../Controller/Auth/authController';
import { refreshTokenHandler } from '../Middleware/tokenManagement';
import { verifyFirebaseToken } from '../Middleware/firebaseAuth';

const router = Router();

// Import Swagger documentation
import '../swagger/authSwagger';

// POST /api/auth/register-traveller
router.post('/register-user', registerUser);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/google-login
router.post('/google-login', googleLogin);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshTokenHandler);

// POST /api/auth/request-password-reset
router.post('/request-password-reset', requestPasswordReset);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// POST /api/auth/change-password
router.post('/change-password', verifyFirebaseToken, changePassword);

// GET /api/auth/sync
// Use this to ensure a Firebase-created user is persisted in MongoDB.
// Call with Authorization: Bearer <Firebase ID token>
router.get('/sync', verifyFirebaseToken, async (req, res) => {
  try {
    const { default: AuthUser } = await import('../Model/authModel');
    const firebaseUser = (req as any).user as { uid: string; email?: string };

    const user = await AuthUser.findOne({
      $or: [
        { firebaseUid: firebaseUser.uid },
        ...(firebaseUser.email ? [{ email: firebaseUser.email }] : []),
      ],
    }).lean();

    res.status(200).json({
      success: true,
      message: 'User synced',
      data: { user },
    });
  } catch (e) {
    console.error('Sync error:', e);
    res.status(500).json({ success: false, message: 'Failed to sync user' });
  }
});

export default router;
