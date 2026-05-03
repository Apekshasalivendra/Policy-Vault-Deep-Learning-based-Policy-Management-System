import { Router } from 'express';
import multer from 'multer';
import * as entitlementController from '../controllers/entitlement.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.get('/policies/:memberId', entitlementController.getPolicies);
router.post('/claims/start', entitlementController.startClaim);
router.post('/claims/upload-document', upload.single('file'), entitlementController.uploadDocument);
router.post('/claims/pre-verify', entitlementController.preVerifyClaim);
router.post('/claims/submit', entitlementController.submitClaim);
router.post('/claims/kyc-submit', entitlementController.kycSubmitClaim);
router.get('/claims/timeline/:claimId', entitlementController.getClaimTimeline);
router.post('/members/:memberId/deceased', entitlementController.markDeceased);

export default router;

