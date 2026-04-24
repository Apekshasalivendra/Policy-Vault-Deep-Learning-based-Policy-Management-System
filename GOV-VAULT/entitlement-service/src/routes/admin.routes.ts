import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';

const router = Router();

router.get('/claims/submitted', adminController.getSubmittedClaims);
router.get('/claims/:claimId', adminController.getClaimById);
router.post('/claims/:claimId/review', adminController.moveToReview);
router.post('/claims/:claimId/approve', adminController.approveClaim);
router.post('/claims/:claimId/reject', adminController.rejectClaim);
router.post('/claims/:claimId/settle', adminController.settleClaim);

export default router;
