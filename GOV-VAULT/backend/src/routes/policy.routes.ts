import { Router } from 'express';
import { getPoliciesForFamily, submitPolicyClaim } from '../controllers/policy.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/family/:familyId', getPoliciesForFamily);
router.post('/family/:familyId/claim', submitPolicyClaim);

export default router;
