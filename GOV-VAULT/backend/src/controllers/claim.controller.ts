import { Request, Response } from 'express';
import * as claimService from '../services/claim.service';

// ── POST /claim/initiate ──────────────────────────────────────────────────────
export const initiateClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { memberId, schemeId } = req.body as { memberId?: string; schemeId?: string };

        if (!memberId || !schemeId) {
            res.status(400).json({ error: 'memberId and schemeId are required' });
            return;
        }

        const userId = req.user!.userId;
        const claim = await claimService.initiateClaim(userId, memberId, schemeId);
        res.status(201).json({ message: 'Claim initiated successfully', claim });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initiate claim';
        const status =
            message.includes('not found') ? 404 :
                message.includes('APPROVED') || message.includes('already exists') ? 409 :
                    message.includes('does not belong') ? 403 :
                        400;
        res.status(status).json({ error: message });
    }
};

// ── GET /claim/my ─────────────────────────────────────────────────────────────
export const getMyClaims = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const claims = await claimService.getMyClaims(userId);
        res.json({ count: claims.length, claims });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch claims';
        res.status(500).json({ error: message });
    }
};

// ── GET /claim/:id ─────────────────────────────────────────────────────────────
export const getClaimById = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const claim = await claimService.getClaimById(userId, id);
        res.json({ claim });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Claim not found';
        const status = message.includes('not found') || message.includes('denied') ? 404 : 500;
        res.status(status).json({ error: message });
    }
};
