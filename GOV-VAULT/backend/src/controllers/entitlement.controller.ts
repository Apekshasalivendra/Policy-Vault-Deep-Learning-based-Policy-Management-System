import { Request, Response } from 'express';
import * as entitlementService from '../services/entitlement.service';

export const getPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const { memberId } = req.params;

        if (!memberId) {
            res.status(400).json({ error: 'memberId is required' });
            return;
        }

        const data = await entitlementService.getPolicies(userId, userRole, memberId);
        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

export const startClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const { memberId, policyId, claimantName } = req.body;

        if (!memberId || !policyId || !claimantName) {
            res.status(400).json({ error: 'memberId, policyId, and claimantName are required' });
            return;
        }

        const data = await entitlementService.startClaim(userId, userRole, memberId, policyId, claimantName);
        res.status(201).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        // req.file is populated by multer in the routes
        const file = req.file;
        const { claimId, documentType } = req.body;

        if (!claimId || !documentType || !file) {
            res.status(400).json({ error: 'claimId, documentType, and file are required' });
            return;
        }

        const data = await entitlementService.uploadDocument(
            userId, userRole, claimId, documentType, file.buffer, file.originalname, file.mimetype
        );
        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

export const preVerifyClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const { claimId } = req.body;

        if (!claimId) {
            res.status(400).json({ error: 'claimId is required' });
            return;
        }

        const data = await entitlementService.preVerifyClaim(userId, userRole, claimId);
        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

import { v4 as uuidv4 } from 'uuid';
import * as notificationService from '../services/notification.service';
import { NotificationType } from '@prisma/client';

export const submitClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const { claimId } = req.body;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const correlationId = uuidv4();

        if (!claimId) {
            res.status(400).json({ error: 'claimId is required' });
            return;
        }

        const data = await entitlementService.submitClaim(userId, userRole, claimId, correlationId, ip, userAgent);

        // Asynchronously notify the user
        if (data && data.memberId) {
            notificationService.createNotification(
                data.memberId,
                data.id,
                NotificationType.CLAIM_SUBMITTED,
                `Your claim (${data.id}) has been successfully Submitted and is awaiting review.`
            ).catch(err => console.error('Notification Engine Failure:', err));
        }

        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

export const getClaimTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const { claimId } = req.params;

        if (!claimId) {
            res.status(400).json({ error: 'claimId is required in path' });
            return;
        }

        const data = await entitlementService.getClaimTimeline(userId, userRole, claimId);
        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};

export const markDeceased = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { memberId } = req.params;

        const data = await entitlementService.markMemberDeceased(userId, memberId);
        res.status(200).json(data);
    } catch (err: any) {
        const [status, message] = err.message.split(':');
        res.status(Number(status) || 500).json({ error: message || err.message });
    }
};
