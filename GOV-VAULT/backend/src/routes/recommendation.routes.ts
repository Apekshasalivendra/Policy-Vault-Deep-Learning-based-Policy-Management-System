import { Router } from 'express';
import { recommend } from '../controllers/recommendation.controller';
import { verifyToken, allowUser } from '../middleware/auth.middleware';

const router = Router();

// All recommendation routes require USER authentication
router.use(verifyToken, allowUser);

// POST /recommendations
// Body (all optional overrides): { state?, gender?, category? }
router.post('/', recommend);

export default router;
