import { PrismaClient, ClaimStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Allowed Transition Matrix
const ALLOWED_TRANSITIONS: Record<string, ClaimStatus[]> = {
    'SUBMITTED': ['UNDER_ADMIN_REVIEW'],
    'UNDER_ADMIN_REVIEW': ['APPROVED', 'REJECTED'],
    'APPROVED': ['SETTLED'],
    'REJECTED': [], // Terminal
    'SETTLED': [], // Terminal
    'INITIATED': [], // Only user can transition out
    'DOCUMENTS_PENDING': [], // Only user can transition out
    'PRE_VERIFIED': [] // Only user can transition out
};

export const getSubmittedClaims = async () => {
    // Only fetch claims that are active in the admin funnel
    const activeAdminStatuses: ClaimStatus[] = ['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'APPROVED'];

    return await prisma.structuredClaim.findMany({
        where: {
            status: { in: activeAdminStatuses }
        },
        include: {
            policy: true
        },
        orderBy: { updatedAt: 'desc' }
    });
};

export const getClaimById = async (claimId: string) => {
    return await prisma.structuredClaim.findUnique({
        where: { id: claimId },
        include: {
            policy: true,
            documents: true,
            timeline: { orderBy: { sequence: 'asc' } }
        }
    });
};

export const transitionState = async (
    claimId: string,
    newState: ClaimStatus,
    note: string,
    adminId: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string
) => {
    const claim = await prisma.structuredClaim.findUnique({
        where: { id: claimId },
        include: { timeline: true }
    });

    if (!claim) {
        throw new Error('Claim not found.');
    }

    // 1. Enforce strict transition rules
    const allowedNextStates = ALLOWED_TRANSITIONS[claim.status] || [];
    if (!allowedNextStates.includes(newState)) {
        throw new Error(`Illegal state transition. Cannot move from ${claim.status} to ${newState}.`);
    }

    // 2. Increment Sequence
    const currentMaxSeq = claim.timeline.reduce((max, t) => t.sequence > max ? t.sequence : max, 0);
    const nextSeq = currentMaxSeq + 1;

    // 3. Optional: Auto-close terminal states
    const isClosed = newState === 'REJECTED' || newState === 'SETTLED';

    // Map Status to Action enum
    const actionMap: Record<string, any> = {
        'UNDER_ADMIN_REVIEW': 'MOVED_TO_REVIEW',
        'APPROVED': 'APPROVED',
        'REJECTED': 'REJECTED',
        'SETTLED': 'SETTLED'
    };

    // 4. Atomic Transaction: Update status + Add timeline event + Audit Event Log
    const [updatedClaim] = await prisma.$transaction([
        prisma.structuredClaim.update({
            where: { id: claimId },
            data: { status: newState, isClosed, updatedAt: new Date() }
        }),
        prisma.claimTimeline.create({
            data: {
                claimId,
                status: newState,
                sequence: nextSeq,
                note
            }
        }),
        prisma.claimEventLog.create({
            data: {
                claimId,
                action: actionMap[newState],
                previousStatus: claim.status,
                newStatus: newState,
                performedById: adminId,
                performedByRole: role,
                ipAddress,
                userAgent,
                correlationId
            }
        })
    ]);

    return updatedClaim;
};
