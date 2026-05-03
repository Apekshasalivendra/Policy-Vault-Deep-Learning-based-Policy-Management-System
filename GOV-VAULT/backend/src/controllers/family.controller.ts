import { Request, Response } from 'express';
import * as familyService from '../services/family.service';

// ── POST /family/create ───────────────────────────────────────────────────────
export const createFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { members, aadhaarVerificationToken, state, category } = req.body as {
            members?: unknown[];
            aadhaarVerificationToken?: string;
            state?: string;
            category?: string;
        };

        if (!aadhaarVerificationToken) {
            res.status(400).json({
                error: 'aadhaarVerificationToken is required. Complete /mock/confirm-aadhaar first.',
            });
            return;
        }

        if (!Array.isArray(members) || members.length === 0) {
            res.status(400).json({ error: 'members must be a non-empty array' });
            return;
        }

        const userId = req.user!.userId;
        const family = await familyService.createFamily(
            userId,
            members as never,
            aadhaarVerificationToken,
            state,
            category
        );

        res.status(201).json({ message: 'Family registered successfully', family });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Family creation failed';

        if (
            message.includes('already registered') ||
            message.includes('Duplicate')
        ) {
            res.status(409).json({ error: message });
            return;
        }
        if (message.includes('limit reached')) {
            res.status(429).json({ error: message });
            return;
        }

        res.status(400).json({ error: message });
    }
};

// ── GET /family/:id ───────────────────────────────────────────────────────────
export const getFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const family = await familyService.getFamilyById(id, userId);
        res.json({ family });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch family';
        res.status(404).json({ error: message });
    }
};

// ── GET /family/my ────────────────────────────────────────────────────────────
// Returns decrypted Aadhaar and PAN for the authenticated owner ONLY.
// Hash and encrypted fields are stripped before sending — data safety enforced at service layer.
export const getMyFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const family = await familyService.getMyFamily(userId);
        res.json({ family });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch your family';
        res.status(404).json({ error: message });
    }
};

// ── PUT /family/update ──────────────────────────────────────────────────────────
export const updateFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { members, aadhaarVerificationToken } = req.body as {
            members?: unknown[];
            aadhaarVerificationToken?: string;
        };

        if (!Array.isArray(members) || members.length === 0) {
            res.status(400).json({ error: 'members must be a non-empty array' });
            return;
        }

        const userId = req.user!.userId;
        const family = await familyService.updateFamily(
            userId,
            members as never,
            aadhaarVerificationToken
        );

        res.status(200).json({ message: 'Family updated successfully', family });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Family update failed';
        if (message.includes('already registered') || message.includes('Duplicate')) {
            res.status(409).json({ error: message });
            return;
        }
        res.status(400).json({ error: message });
    }
};
