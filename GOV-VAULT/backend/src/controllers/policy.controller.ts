import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A fixed pool of mock policies to randomly select from
const MOCK_POLICIES = [
    { id: 'POL_LIC_001', name: 'LIC Jeevan Anand', type: 'Life Insurance', baseAmount: 500000 },
    { id: 'POL_SBI_002', name: 'SBI Life Smart Scholar', type: 'Child Education', baseAmount: 250000 },
    { id: 'POL_HDFC_003', name: 'HDFC Life Click 2 Protect', type: 'Term Insurance', baseAmount: 1000000 },
    { id: 'POL_POST_004', name: 'Post Office Monthly Income Scheme', type: 'Investment', baseAmount: 100000 },
    { id: 'POL_MAX_005', name: 'Max Life Smart Wealth', type: 'Wealth Plan', baseAmount: 750000 }
];

export const getPoliciesForFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.params;

        // Fetch family members to intelligently generate nominees
        const family = await prisma.family.findUnique({
            where: { id: familyId },
            include: { members: true }
        });

        if (!family || family.members.length === 0) {
            res.status(404).json({ error: 'Family not found or has no members' });
            return;
        }

        const members = family.members;
        // Deterministically select a subset of policies based on familyId so it stays consistent
        const seed = familyId.split('-')[0].charCodeAt(0);
        const policyCount = (seed % 3) + 1; // 1 to 3 policies

        const policies = [];

        for (let i = 0; i < policyCount; i++) {
            const template = MOCK_POLICIES[(seed + i) % MOCK_POLICIES.length];
            
            // Randomly select a policy holder
            const holderIndex = (seed + i) % members.length;
            const holder = members[holderIndex];

            // Other members become nominees
            const nominees = members
                .filter(m => m.id !== holder.id)
                .map((m, idx, arr) => {
                    // Distribute percentages
                    const percentage = Math.floor(100 / arr.length);
                    // Give remainder to the first nominee
                    const finalPercentage = idx === 0 ? percentage + (100 % arr.length) : percentage;
                    return {
                        id: m.id,
                        name: m.nameAsInAadhaar,
                        relation: 'Family Member', // Simplification
                        percentage: finalPercentage
                    };
                });

            // If only 1 member in family, no nominees
            if (nominees.length === 0) {
                nominees.push({
                    id: 'NOM_SELF',
                    name: 'Self / Legal Heir',
                    relation: 'Self',
                    percentage: 100
                });
            }

            policies.push({
                id: template.id,
                name: template.name,
                type: template.type,
                amount: template.baseAmount,
                holderId: holder.id,
                holderName: holder.nameAsInAadhaar,
                nominees
            });
        }

        res.json({ policies });
    } catch (error) {
        console.error('Error fetching policies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const submitPolicyClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.params;
        const { policyId, policyName, memberId, memberName, percentage, nominees } = req.body;

        // Verify member exists in family
        const member = await prisma.familyMember.findFirst({
            where: { id: memberId, familyId }
        });

        if (!member) {
            res.status(404).json({ error: 'Claimant not found in family' });
            return;
        }

        const claim = await prisma.claim.create({
            data: {
                familyId,
                memberId,
                schemeId: policyId, // Reuse schemeId for policy ID
                category: 'POLICY', // Distinguish from SCHEME
                status: 'PENDING',
                source: 'MANUAL',
                metadata: {
                    policyName,
                    claimantName: memberName,
                    claimantPercentage: percentage,
                    allNominees: nominees
                }
            }
        });

        res.status(201).json({ claim });
    } catch (error) {
        console.error('Error submitting policy claim:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
