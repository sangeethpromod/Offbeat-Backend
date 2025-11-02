import { Router } from 'express';
import {
  registerTraveller,
  login,
  googleLogin,
} from '../Controller/Auth/authController';
import { verifyFirebaseToken } from '../Middleware/firebaseAuth';

const router = Router();

// Import Swagger documentation
import '../swagger/authSwagger';

// POST /api/auth/register-traveller
router.post('/register-traveller', registerTraveller);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/google-login
router.post('/google-login', googleLogin);

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
