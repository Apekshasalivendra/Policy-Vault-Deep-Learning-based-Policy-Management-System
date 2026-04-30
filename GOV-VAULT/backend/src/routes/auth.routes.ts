import { Router } from 'express';
import { register, login, me, sendVerificationEmail, verifyEmail } from '../controllers/auth.controller';
import { verifyToken, allowUser } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/send-verification-email', sendVerificationEmail);
router.post('/verify-email', verifyEmail);
router.post('/register', register);
router.post('/login', login);

// Protected route (any authenticated user)
router.get('/me', verifyToken, allowUser, me);

export default router;
