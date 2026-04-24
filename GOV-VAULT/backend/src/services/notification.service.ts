import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export const createNotification = async (userId: string, claimId: string, type: NotificationType, message: string) => {
    try {
        await prisma.notification.create({
            data: {
                userId,
                claimId,
                type,
                message,
            },
        });
        console.log(`[NotificationEngine] Created: ${type} for User ${userId} on Claim ${claimId}`);
    } catch (error: any) {
        // Idempotency Catch
        if (error.code === 'P2002') {
            console.log(`[NotificationEngine] Idempotency Skip: ${type} already exists for User ${userId} on Claim ${claimId}`);
        } else {
            console.error(`[NotificationEngine] Failed to create notification:`, error.message);
        }
    }
};

export const getUserNotifications = async (userId: string) => {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};

export const markAsRead = async (notificationId: string, userId: string) => {
    return prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
    });
};
