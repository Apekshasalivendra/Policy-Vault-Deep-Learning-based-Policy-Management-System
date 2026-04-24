import { Request, Response } from 'express';
import * as policyService from '../services/policy.service';

export const getMemberPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { memberId } = req.params;

        if (!memberId) {
            res.status(400).json({ error: "memberId is required" });
            return;
        }

        const data = await policyService.getPoliciesForMember(memberId);

        if (!data) {
            res.status(404).json({ error: "Member not found" });
            return;
        }

        res.status(200).json(data);
    } catch (error: any) {
        console.error("[PolicyController] Error fetching policies:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
