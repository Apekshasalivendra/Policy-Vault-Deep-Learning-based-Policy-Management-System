import { Request, Response } from 'express';
import { registerMembers, markMemberDeceased } from '../services/member.service';

/**
 * POST /members/register
 * Body: { memberIds: string[] }
 * Called by the backend gateway after a family is approved.
 */
export const registerMembersHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { memberIds } = req.body as { memberIds?: string[] };

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            res.status(400).json({ error: 'memberIds must be a non-empty array' });
            return;
        }

        await registerMembers(memberIds);
        res.status(200).json({ registered: memberIds.length, memberIds });
    } catch (err: any) {
        console.error('[MemberController] registerMembers error:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * POST /members/:memberId/deceased
 * Marks a member as deceased.
 */
export const markDeceasedHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { memberId } = req.params;
        const updated = await markMemberDeceased(memberId);
        res.status(200).json({ memberId: updated.memberId, isDeceased: updated.isDeceased });
    } catch (err: any) {
        console.error('[MemberController] markDeceased error:', err.message);
        const status = err.message.includes('not found') ? 404
            : err.message.includes('already') ? 409
            : 500;
        res.status(status).json({ error: err.message });
    }
};
