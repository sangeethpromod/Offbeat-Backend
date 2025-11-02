import { Router } from 'express';
import { registerTraveller, login } from '../Controller/Auth/authController';

const router = Router();

// Import Swagger documentation
import '../swagger/authSwagger';

// POST /api/auth/register-traveller
router.post('/register-traveller', registerTraveller);

// POST /api/auth/login
router.post('/login', login);

export default router;
