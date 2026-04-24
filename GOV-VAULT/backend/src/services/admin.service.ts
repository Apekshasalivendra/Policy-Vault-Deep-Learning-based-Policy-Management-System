import { PrismaClient, FamilyStatus, ClaimStatus } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const ENTITLEMENT_SERVICE_URL = process.env.ENTITLEMENT_SERVICE_URL || 'http://localhost:4000';

// ── Register members in the entitlement service (fire-and-forget) ─────────────
const registerMembersInEntitlementService = async (memberIds: string[]): Promise<void> => {
    try {
        await axios.post(`${ENTITLEMENT_SERVICE_URL}/members/register`, { memberIds });
        console.log(`[admin.service] Registered ${memberIds.length} member(s) in entitlement service`);
    } catch (err: any) {
        // Non-fatal — log but don't block approval
        console.error('[admin.service] Failed to register members in entitlement service:', err?.message);
    }
};

// ── List Pending Families ─────────────────────────────────────────────────────
export const listPendingFamilies = async () => {
    return prisma.family.findMany({
        where: { status: FamilyStatus.PENDING },
        include: {
            createdBy: { select: { id: true, email: true } },
            _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'asc' },
    });
};

// ── Approve Family ────────────────────────────────────────────────────────────
export const approveFamily = async (adminId: string, familyId: string) => {
    const family = await prisma.family.findUnique({
        where: { id: familyId },
        include: { members: { select: { id: true } } },
    });
    if (!family) throw new Error('Family not found');
    if (family.status !== FamilyStatus.PENDING) {
        throw new Error(`Family is already ${family.status.toLowerCase()}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.family.update({
            where: { id: familyId },
            data: { status: FamilyStatus.APPROVED },
            include: { _count: { select: { members: true } } },
        });
        await tx.auditLog.create({
            data: { userId: adminId, action: `FAMILY_APPROVED:${family.temporaryFamilyId}` },
        });
        return result;
    });

    // Register all members in the entitlement service (non-blocking)
    const memberIds = family.members.map((m) => m.id);
    void registerMembersInEntitlementService(memberIds);

    return updated;
};


// ── Reject Family ─────────────────────────────────────────────────────────────
export const rejectFamily = async (adminId: string, familyId: string) => {
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) throw new Error('Family not found');
    if (family.status !== FamilyStatus.PENDING) {
        throw new Error(`Family is already ${family.status.toLowerCase()}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.family.update({
            where: { id: familyId },
            data: { status: FamilyStatus.REJECTED },
            include: { _count: { select: { members: true } } },
        });
        await tx.auditLog.create({
            data: { userId: adminId, action: `FAMILY_REJECTED:${family.temporaryFamilyId}` },
        });
        return result;
    });

    return updated;
};

// ── List All Families (with filter) ──────────────────────────────────────────
export const listAllFamilies = async (status?: FamilyStatus) => {
    return prisma.family.findMany({
        where: status ? { status } : undefined,
        include: {
            createdBy: { select: { id: true, email: true } },
            _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
};

// ── Admin Dashboard Metrics ───────────────────────────────────────────────────
export const getDashboardMetrics = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalFamilies,
        pendingFamilies,
        approvedFamilies,
        rejectedFamilies,
        totalMembers,
        familiesLast7Days,
    ] = await Promise.all([
        prisma.family.count(),
        prisma.family.count({ where: { status: FamilyStatus.PENDING } }),
        prisma.family.count({ where: { status: FamilyStatus.APPROVED } }),
        prisma.family.count({ where: { status: FamilyStatus.REJECTED } }),
        prisma.familyMember.count(),
        prisma.family.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    return {
        totalFamilies,
        pendingFamilies,
        approvedFamilies,
        rejectedFamilies,
        totalMembers,
        familiesLast7Days,
    };
};

// ── List Pending Claims ───────────────────────────────────────────────────────
export const listPendingClaims = async () => {
    return prisma.claim.findMany({
        where: { status: ClaimStatus.PENDING },
        include: {
            member: { select: { id: true, name: true, age: true, occupation: true } },
            family: { select: { id: true, temporaryFamilyId: true } },
        },
        orderBy: { createdAt: 'asc' },
    });
};

// ── Approve Claim ─────────────────────────────────────────────────────────────
export const approveClaim = async (adminId: string, claimId: string) => {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error('Claim not found');
    if (claim.status !== ClaimStatus.PENDING) {
        throw new Error(`Claim is already ${claim.status.toLowerCase()}`);
    }

    return prisma.$transaction(async (tx) => {
        const updated = await tx.claim.update({
            where: { id: claimId },
            data: { status: ClaimStatus.APPROVED },
        });
        await tx.auditLog.create({
            data: { userId: adminId, action: `CLAIM_APPROVED:${claimId}` },
        });
        return updated;
    });
};

// ── Reject Claim ──────────────────────────────────────────────────────────────
export const rejectClaim = async (adminId: string, claimId: string) => {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error('Claim not found');
    if (claim.status !== ClaimStatus.PENDING) {
        throw new Error(`Claim is already ${claim.status.toLowerCase()}`);
    }

    return prisma.$transaction(async (tx) => {
        const updated = await tx.claim.update({
            where: { id: claimId },
            data: { status: ClaimStatus.REJECTED },
        });
        await tx.auditLog.create({
            data: { userId: adminId, action: `CLAIM_REJECTED:${claimId}` },
        });
        return updated;
    });
};
