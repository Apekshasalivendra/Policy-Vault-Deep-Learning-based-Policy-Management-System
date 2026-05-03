import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as orphanController from '../controllers/orphan.controller';
import { getAuditLogsHandler } from '../controllers/auditLog.controller';
import { verifyToken, allowAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(verifyToken, allowAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/families/pending', adminController.getPendingFamilies);
router.get('/families', adminController.getAllFamilies);
router.post('/family/:id/approve', adminController.approveFamily);
router.post('/family/:id/reject', adminController.rejectFamily);
router.post('/family/:id/request-docs', adminController.requestDocs);
router.get('/claims/pending', adminController.getPendingClaims);
router.post('/claim/:id/approve', adminController.approveClaim);
router.post('/claim/:id/reject', adminController.rejectClaim);
router.get('/policy-claims/pending', adminController.getPendingPolicyClaims);
router.post('/policy-claim/:id/approve', adminController.approveClaim);
router.post('/policy-claim/:id/reject', adminController.rejectClaim);
router.post('/policy-claim/:id/request-docs', adminController.requestPolicyDocsHandler);
router.get('/audit-logs', getAuditLogsHandler);

// Orphan Child Trust Funds
router.get('/orphans', orphanController.getOrphans);
router.post('/orphans', orphanController.registerOrphan);
router.post('/orphans/:id/verify', orphanController.verifyOrphan);
router.post('/orphans/:id/deduct-fee', orphanController.deductFund);

export default router;
