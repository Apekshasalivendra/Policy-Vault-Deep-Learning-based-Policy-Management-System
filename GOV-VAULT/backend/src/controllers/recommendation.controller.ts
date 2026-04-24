import { Request, Response } from 'express';
import * as familyService from '../services/family.service';
import { getRecommendations, RecommendationPayload } from '../services/recommendation.service';

// ── POST /recommendations ─────────────────────────────────────────────────────
// Fetches the user's family profile, transforms it into AI input format,
// calls the Scheme AI Service, and returns top 5 scheme recommendations.
//
// NOTE: This does NOT auto-create claims. Recommendations are advisory only.
export const recommend = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;

        // 1. Fetch authenticated user's family profile
        const family = await familyService.getMyFamily(userId);
        if (!family || !family.members || family.members.length === 0) {
            res.status(404).json({ error: 'No family profile found. Please register your family first.' });
            return;
        }

        // 2. Use the primary member (first in list) to build the AI payload
        //    Additional members' occupations/income are aggregated in additional_details
        const primary = family.members[0];

        // Income range mapping: prefer primary member, include family count for context
        const payload: RecommendationPayload = {
            state: req.body?.state || 'Maharashtra',   // can be overridden via request body
            incomeRange: primary.incomeRange,
            occupation: primary.occupation,
            age: primary.age,
            gender: req.body?.gender || 'Male',         // family member gender not stored — allow override
            category: req.body?.category || 'General',   // caste category — allow override
            familySize: family.memberCount,
        };

        // 3. Call AI service (Phase 5: pass userId + familyId for recommendation logging)
        const result = await getRecommendations(payload, userId, family.id);

        // 4. Return snapshot-shaped response (Phase 5 ready for logging)
        if (result.unavailable) {
            res.status(503).json({
                unavailable: true,
                message: result.message,
                schemes: [],
            });
            return;
        }

        res.json({
            familyId: family.id,
            memberCount: family.memberCount,
            count: result.schemes.length,
            schemes: result.schemes,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get recommendations';
        console.error('[recommendation.controller] Unexpected error:', message);
        res.status(500).json({ error: message });
    }
};
