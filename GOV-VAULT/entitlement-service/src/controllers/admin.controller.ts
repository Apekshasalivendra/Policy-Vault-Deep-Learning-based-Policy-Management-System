import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';

export const getSubmittedClaims = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await adminService.getSubmittedClaims();
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getClaimById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId } = req.params;
        if (!claimId) {
            res.status(400).json({ error: 'claimId is required' });
            return;
        }

        const data = await adminService.getClaimById(claimId);
        if (!data) {
            res.status(404).json({ error: 'Claim not found' });
            return;
        }

        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const moveToReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId } = req.params;
        const note = req.body?.note || 'Admin began review process.';
        const adminId = req.headers['x-user-id'] as string || 'system';
        const role = req.headers['x-user-role'] as string || 'ADMIN';
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] as string;
        const correlationId = req.headers['x-correlation-id'] as string;

        if (!claimId) {
            res.status(400).json({ error: 'claimId is required' });
            return;
        }

        const data = await adminService.transitionState(claimId, 'UNDER_ADMIN_REVIEW', note, adminId, role, ip, userAgent, correlationId);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const approveClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId } = req.params;
        const note = req.body?.note || 'Claim approved by Administration.';
        const adminId = req.headers['x-user-id'] as string || 'system';
        const role = req.headers['x-user-role'] as string || 'ADMIN';
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] as string;
        const correlationId = req.headers['x-correlation-id'] as string;

        if (!claimId) {
            res.status(400).json({ error: 'claimId is required' });
            return;
        }

        const data = await adminService.transitionState(claimId, 'APPROVED', note, adminId, role, ip, userAgent, correlationId);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const rejectClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId } = req.params;
        const note = req.body?.note || 'Claim rejected by Administration.';
        const adminId = req.headers['x-user-id'] as string || 'system';
        const role = req.headers['x-user-role'] as string || 'ADMIN';
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] as string;
        const correlationId = req.headers['x-correlation-id'] as string;

        if (!claimId) {
            res.status(400).json({ error: 'claimId is required' });
            return;
        }

        const data = await adminService.transitionState(claimId, 'REJECTED', note, adminId, role, ip, userAgent, correlationId);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const settleClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId } = req.params;
        const note = req.body?.note || 'Claim funds settled and distributed.';
        const adminId = req.headers['x-user-id'] as string || 'system';
        const role = req.headers['x-user-role'] as string || 'ADMIN';
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] as string;
        const correlationId = req.headers['x-correlation-id'] as string;

        if (!claimId) {
            res.status(400).json({ error: 'claimId is required' });
            return;
        }

        const data = await adminService.transitionState(claimId, 'SETTLED', note, adminId, role, ip, userAgent, correlationId);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
