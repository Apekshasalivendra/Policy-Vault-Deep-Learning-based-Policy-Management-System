import { Router } from 'express';
import { verifyAadhaar, confirmAadhaar, verifyPan } from '../controllers/mock.controller';

const router = Router();

router.post('/verify-aadhaar', verifyAadhaar);
router.post('/confirm-aadhaar', confirmAadhaar);
router.post('/verify-pan', verifyPan);

export default router;
