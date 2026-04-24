import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notification.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Protect all notification routes
router.use(verifyToken);

// GET /notifications — Fetch all notifications for the authenticated user
router.get('/', getNotifications);

// POST /notifications/:id/read — Mark a specific notification as read
router.post('/:id/read', markNotificationRead);

export default router;
