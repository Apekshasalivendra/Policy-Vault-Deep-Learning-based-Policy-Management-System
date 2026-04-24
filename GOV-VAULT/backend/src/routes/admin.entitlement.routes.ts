import { Router } from 'express';
import { verifyToken, allowAdmin } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.entitlement.controller';

const router = Router();

// Protect ALL routes below with JWT Token AND strictly Admin RBAC policies
router.use(verifyToken);
router.use(allowAdmin);

router.get('/admin/entitlements/claims/submitted', adminController.getSubmittedClaims);
router.get('/admin/entitlements/claims/:claimId', adminController.getClaimById);

// Admin Mutation Endpoints (Phase 6 State Machine Triggers)
router.post('/admin/entitlements/claims/:claimId/review', adminController.reviewClaim);
router.post('/admin/entitlements/claims/:claimId/approve', adminController.approveClaim);
router.post('/admin/entitlements/claims/:claimId/reject', adminController.rejectClaim);
router.post('/admin/entitlements/claims/:claimId/settle', adminController.settleClaim);

export default router;
