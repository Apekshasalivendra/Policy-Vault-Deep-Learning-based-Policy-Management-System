import { Router } from 'express';
import { getRecommendationAnalyticsHandler } from '../controllers/analytics.controller';
import { verifyToken, allowAdmin } from '../middleware/auth.middleware';

const router = Router();

// All analytics routes require ADMIN authentication
router.use(verifyToken, allowAdmin);

router.get('/recommendations', getRecommendationAnalyticsHandler);

export default router;
