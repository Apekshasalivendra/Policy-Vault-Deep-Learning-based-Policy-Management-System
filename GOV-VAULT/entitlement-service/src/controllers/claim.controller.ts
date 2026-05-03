import { Request, Response } from 'express';
import * as claimService from '../services/claim.service';

export const startClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { memberId, policyId, claimantName } = req.body;
        if (!memberId || !policyId || !claimantName) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const result = await claimService.startClaimLogic(memberId, policyId, claimantName);
        res.status(201).json(result);
    } catch (error: any) {
        console.error("[ClaimController] startClaim error:", error.message);
        res.status(400).json({ error: error.message });
    }
};

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId, documentType } = req.body;
        const file = req.file;

        if (!claimId || !documentType || !file) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const result = await claimService.uploadDocumentLogic(claimId, documentType, file.path);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("[ClaimController] uploadDocument error:", error.message);
        res.status(400).json({ error: error.message });
    }
};

export const preVerifyClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId } = req.body;
        if (!claimId) {
            res.status(400).json({ error: "claimId is required" });
            return;
        }

        const result = await claimService.preVerifyLogic(claimId);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("[ClaimController] preVerify error:", error.message);
        res.status(400).json({ error: error.message });
    }
};

export const submitClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId } = req.body;
        const userId = req.headers['x-user-id'] as string || 'system';
        const userRole = req.headers['x-user-role'] as string || 'USER';
        const correlationId = req.headers['x-correlation-id'] as string;
        const ip = req.headers['x-forwarded-for'] as string;
        const userAgent = req.headers['user-agent'] as string;

        if (!claimId) {
            res.status(400).json({ error: "claimId is required" });
            return;
        }

        const result = await claimService.submitClaimLogic(claimId, userId, userRole, correlationId, ip, userAgent);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("[ClaimController] submitClaim error:", error.message);
        res.status(400).json({ error: error.message });
    }
};

export const getClaimTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId } = req.params;
        if (!claimId) {
            res.status(400).json({ error: "claimId is required in path" });
            return;
        }

        const timeline = await claimService.getTimelineLogic(claimId);
        res.status(200).json(timeline);
    } catch (error: any) {
        console.error("[ClaimController] getTimeline error:", error.message);
        res.status(404).json({ error: error.message });
    }
};
export const kycSubmitClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { claimId, kycMethod, claimType } = req.body;
        if (!claimId) {
            res.status(400).json({ error: "claimId is required" });
            return;
        }
        const result = await claimService.kycSubmitLogic(claimId, kycMethod || 'RAZORPAY', claimType || 'MATURITY');
        res.status(200).json(result);
    } catch (error: any) {
        console.error("[ClaimController] kycSubmit error:", error.message);
        res.status(400).json({ error: error.message });
    }
};
