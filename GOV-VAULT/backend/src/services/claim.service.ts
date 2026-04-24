import { PrismaClient, ClaimStatus, FamilyStatus, ClaimSource } from '@prisma/client';
import { wasSchemeAiRecommended } from './recommendationLog.service';

const prisma = new PrismaClient();

// ── Initiate Claim ─────────────────────────────────────────────────────────────
export const initiateClaim = async (
    userId: string,
    memberId: string,
    schemeId: string
) => {
    // 1. Find the member and confirm it belongs to one of the user's APPROVED families
    const member = await prisma.familyMember.findUnique({
        where: { id: memberId },
        include: { family: true },
    });

    if (!member) {
        throw new Error('Member not found');
    }

    if (member.family.createdById !== userId) {
        throw new Error('Member does not belong to your family');
    }

    if (member.family.status !== FamilyStatus.APPROVED) {
        throw new Error(
            `Family must be APPROVED before initiating a claim (current status: ${member.family.status})`
        );
    }

    // 2. Prevent duplicate pending/approved claim for same member + scheme
    const existingClaim = await prisma.claim.findFirst({
        where: {
            memberId,
            schemeId,
            status: { in: [ClaimStatus.PENDING, ClaimStatus.APPROVED] },
        },
    });
    if (existingClaim) {
        throw new Error(
            `An active claim for scheme "${schemeId}" already exists for this member`
        );
    }

    // 3. Phase 5 — determine claim source
    // If the user received an AI recommendation for this scheme within the last 7 days,
    // mark the claim as AI_RECOMMENDED. Otherwise MANUAL.
    const aiRecommended = await wasSchemeAiRecommended(
        userId,
        member.familyId,
        schemeId
    );
    const claimSource: ClaimSource = aiRecommended
        ? ClaimSource.AI_RECOMMENDED
        : ClaimSource.MANUAL;

    // 4. Create the claim inside a transaction with audit log
    const claim = await prisma.$transaction(async (tx) => {
        const newClaim = await tx.claim.create({
            data: {
                familyId: member.familyId,
                memberId,
                schemeId,
                status: ClaimStatus.PENDING,
                source: claimSource,        // Phase 5
            },
        });

        await tx.auditLog.create({
            data: {
                userId,
                action: `CLAIM_INITIATED:${newClaim.id}:SCHEME:${schemeId}:SOURCE:${claimSource}`,
            },
        });

        return newClaim;
    });

    return claim;
};

// ── Get My Claims ─────────────────────────────────────────────────────────────
export const getMyClaims = async (userId: string) => {
    const claims = await prisma.claim.findMany({
        where: {
            family: { createdById: userId },
        },
        include: {
            member: {
                select: { id: true, name: true, age: true, occupation: true },
            },
            family: {
                select: { id: true, temporaryFamilyId: true, status: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return claims;
};
