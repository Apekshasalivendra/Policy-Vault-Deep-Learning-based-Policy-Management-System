import { Router } from 'express';
import { initiateClaim, getMyClaims } from '../controllers/claim.controller';
import { verifyToken, allowUser } from '../middleware/auth.middleware';

const router = Router();

// All claim routes require USER authentication
router.use(verifyToken, allowUser);

router.post('/initiate', initiateClaim);
router.get('/my', getMyClaims);

export default router;
