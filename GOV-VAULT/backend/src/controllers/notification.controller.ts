import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const notifications = await notificationService.getUserNotifications(userId);
        res.status(200).json(notifications);
    } catch (err: any) {
        console.error('[NotificationController] getNotifications error:', err.message);
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
};

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'Notification ID is required.' });
            return;
        }

        await notificationService.markAsRead(id, userId);
        res.status(200).json({ success: true, message: 'Notification marked as read.' });
    } catch (err: any) {
        console.error('[NotificationController] markRead error:', err.message);
        res.status(500).json({ error: 'Failed to mark notification as read.' });
    }
};
