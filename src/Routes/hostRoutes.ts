import { Router } from 'express';
import upload from '../Utils/multerConfig';
import {
  registerHostStep1,
  registerHostStep2,
  registerHostStep3,
  getHostStatus,
  updateHostProfile,
  resetHostPassword,
} from '../Controller/Host/hostController';
import { verifyAccessToken } from '../Middleware/tokenManagement';

const router = Router();

// Import Swagger documentation
import '../swagger/hostSwagger';

// POST /api/host/register-step1
router.post('/register-step1', registerHostStep1);

// PATCH /api/host/register-step2/:userId
router.patch('/register-step2/:userId', registerHostStep2);

// PATCH /api/host/register-step3/:userId (with file uploads)
router.patch(
  '/register-step3/:userId',
  upload.fields([
    { name: 'aadharFile', maxCount: 2 },
    { name: 'pccCertificateFile', maxCount: 1 },
    { name: 'livePicFile', maxCount: 1 },
  ]),
  registerHostStep3
);

// GET /api/host/status/:userId
router.get('/status/:userId', getHostStatus);

// PATCH /api/host/update-profile - Update host profile details (requires authentication)
router.patch('/update-profile', verifyAccessToken, updateHostProfile);

// PATCH /api/host/reset-password - Reset password (requires authentication)
router.patch('/reset-password', verifyAccessToken, resetHostPassword);

export default router;
