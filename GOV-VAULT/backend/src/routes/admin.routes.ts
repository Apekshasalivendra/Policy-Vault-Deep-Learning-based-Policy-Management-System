import { Router } from 'express';
import {
    getPendingFamilies,
    getAllFamilies,
    approveFamily,
    rejectFamily,
    getDashboard,
    getPendingClaims,
    approveClaim,
    rejectClaim,
} from '../controllers/admin.controller';
import { getAuditLogsHandler } from '../controllers/auditLog.controller';
import { verifyToken, allowAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(verifyToken, allowAdmin);

router.get('/dashboard', getDashboard);            // Phase 3
router.get('/families/pending', getPendingFamilies);
router.get('/families', getAllFamilies);
router.post('/family/:id/approve', approveFamily);
router.post('/family/:id/reject', rejectFamily);
router.get('/claims/pending', getPendingClaims);   // Phase 3
router.post('/claim/:id/approve', approveClaim);   // Phase 3
router.post('/claim/:id/reject', rejectClaim);     // Phase 3
router.get('/audit-logs', getAuditLogsHandler);    // Governance audit trail

export default router;
