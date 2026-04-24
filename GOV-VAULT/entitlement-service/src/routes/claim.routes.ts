import { Router } from 'express';
import * as claimController from '../controllers/claim.controller';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post('/start', claimController.startClaim);
router.post('/upload-document', upload.single('file'), claimController.uploadDocument);
router.post('/pre-verify', claimController.preVerifyClaim);
router.post('/submit', claimController.submitClaim);
router.get('/timeline/:claimId', claimController.getClaimTimeline);

export default router;
