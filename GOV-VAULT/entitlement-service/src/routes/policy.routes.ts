import { Router } from 'express';
import * as policyController from '../controllers/policy.controller';

const router = Router();

router.get('/:memberId', policyController.getMemberPolicies);

export default router;
