import { Request, Response } from 'express';
import * as adminService from '../services/admin.entitlement.service';

export const getSubmittedClaims = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user!.userId;
        const role = req.user!.role;
        const data = await adminService.getSubmittedClaims(adminId, role);
        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

export const getClaimById = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user!.userId;
        const role = req.user!.role;
        const { claimId } = req.params;

        const data = await adminService.getClaimById(adminId, role, claimId);
        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

import { v4 as uuidv4 } from 'uuid';
import * as notificationService from '../services/notification.service';
import { NotificationType } from '@prisma/client';

export const reviewClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user!.userId;
        const role = req.user!.role;
        const { claimId } = req.params;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const correlationId = uuidv4();

        const data = await adminService.reviewClaim(adminId, role, claimId, correlationId, ip, userAgent);
        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

export const approveClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user!.userId;
        const role = req.user!.role;
        const { claimId } = req.params;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const correlationId = uuidv4();

        const data = await adminService.approveClaim(adminId, role, claimId, correlationId, ip, userAgent);

        // Asynchronously notify the user
        if (data && data.memberId) {
            notificationService.createNotification(
                data.memberId,
                data.id,
                NotificationType.CLAIM_APPROVED,
                `Your claim (${data.id}) has been Approved by Administration.`
            ).catch(err => console.error('Notification Engine Failure:', err));
        }

        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

export const rejectClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user!.userId;
        const role = req.user!.role;
        const { claimId } = req.params;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const correlationId = uuidv4();

        const data = await adminService.rejectClaim(adminId, role, claimId, correlationId, ip, userAgent);

        // Asynchronously notify the user
        if (data && data.memberId) {
            notificationService.createNotification(
                data.memberId,
                data.id,
                NotificationType.CLAIM_REJECTED,
                `Your claim (${data.id}) has been Rejected by Administration.`
            ).catch(err => console.error('Notification Engine Failure:', err));
        }

        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

export const settleClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user!.userId;
        const role = req.user!.role;
        const { claimId } = req.params;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const correlationId = uuidv4();

        const data = await adminService.settleClaim(adminId, role, claimId, correlationId, ip, userAgent);

        // Asynchronously notify the user
        if (data && data.memberId) {
            notificationService.createNotification(
                data.memberId,
                data.id,
                NotificationType.CLAIM_SETTLED,
                `Funds for claim (${data.id}) have been Settled.`
            ).catch(err => console.error('Notification Engine Failure:', err));
        }

        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};
