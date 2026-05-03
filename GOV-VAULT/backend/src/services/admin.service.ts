import { PrismaClient, FamilyStatus, ClaimStatus } from '@prisma/client';
import axios from 'axios';
import { sendMockDocumentRequestEmail, sendPolicyDocumentRequestEmail } from './email.service';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const ENTITLEMENT_SERVICE_URL = process.env.ENTITLEMENT_SERVICE_URL || 'http://entitlement-service:4000';

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
            members: {
                select: {
                    id: true,
                    nameAsInAadhaar: true,
                    phoneAsInAadhaar: true,
                    age: true,
                    gender: true,
                    religion: true,
                    physicallyDisabled: true,
                    occupation: true,
                    incomeRange: true,
                    isAadhaarVerified: true,
                    isPanVerified: true,
                }
            },
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

    // EPHEMERAL STORAGE: Delete physical files and DB records for privacy
    const documents = await prisma.familyDocument.findMany({ where: { familyId } });
    for (const doc of documents) {
        try {
            const absolutePath = path.join(__dirname, '../..', doc.filePath);
            if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
        } catch (e) {
            console.error(`[admin.service] Failed to delete file ${doc.filePath}`, e);
        }
    }
    if (documents.length > 0) {
        await prisma.familyDocument.deleteMany({ where: { familyId } });
    }

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

    // EPHEMERAL STORAGE: Delete physical files and DB records for privacy
    const documents = await prisma.familyDocument.findMany({ where: { familyId } });
    for (const doc of documents) {
        try {
            const absolutePath = path.join(__dirname, '../..', doc.filePath);
            if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
        } catch (e) {
            console.error(`[admin.service] Failed to delete file ${doc.filePath}`, e);
        }
    }
    if (documents.length > 0) {
        await prisma.familyDocument.deleteMany({ where: { familyId } });
    }

    return updated;
};

// ── Request Mock Documents ──────────────────────────────────────────────────
export const requestDocs = async (adminId: string, familyId: string) => {
    const family = await prisma.family.findUnique({
        where: { id: familyId },
        include: { createdBy: { select: { email: true } } },
    });
    if (!family) throw new Error('Family not found');
    if (family.status !== FamilyStatus.PENDING) {
        throw new Error(`Cannot request docs for family with status ${family.status}`);
    }

    // Send email to the user who created the family
    if (family.createdBy?.email) {
        await sendMockDocumentRequestEmail(family.createdBy.email, familyId);
    } else {
        throw new Error('User email not found for this family');
    }

    await prisma.auditLog.create({
        data: { userId: adminId, action: `DOCS_REQUESTED:${family.temporaryFamilyId}` },
    });

    return family;
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

// ── List Pending Scheme Claims ────────────────────────────────────────────────
export const listPendingClaims = async () => {
    return prisma.claim.findMany({
        where: { status: ClaimStatus.PENDING, category: 'SCHEME' },
        include: {
            member: {
                select: {
                    id: true,
                    nameAsInAadhaar: true,
                    age: true,
                    occupation: true,
                    incomeRange: true,
                    gender: true,
                    religion: true,
                    physicallyDisabled: true,
                }
            },
            family: {
                select: {
                    id: true,
                    temporaryFamilyId: true,
                    state: true,
                    category: true,
                    createdBy: { select: { email: true } },
                }
            },
        },
        orderBy: { createdAt: 'asc' },
    });
};

// ── List Pending Policy Claims ────────────────────────────────────────────────
export const listPendingPolicyClaims = async () => {
    return prisma.claim.findMany({
        where: { status: ClaimStatus.PENDING, category: 'POLICY' },
        include: {
            member: {
                select: {
                    id: true,
                    nameAsInAadhaar: true,
                    age: true,
                    gender: true,
                    religion: true,
                }
            },
            family: {
                select: {
                    id: true,
                    temporaryFamilyId: true,
                    createdBy: { select: { email: true } },
                }
            },
        },
        orderBy: { createdAt: 'asc' },
    });
};

// ── Request Policy Claim Documents via Email ───────────────────────────────────
export const requestPolicyDocs = async (adminId: string, claimId: string) => {
    const claim = await prisma.claim.findUnique({
        where: { id: claimId },
        include: {
            family: { include: { createdBy: { select: { email: true } } } },
        },
    });
    if (!claim) throw new Error('Claim not found');
    if (claim.status !== ClaimStatus.PENDING) {
        throw new Error(`Cannot request docs for claim with status ${claim.status}`);
    }

    const email = claim.family.createdBy?.email;
    if (!email) throw new Error('User email not found for this claim');

    const meta = claim.metadata as Record<string, string> | null;
    const policyName = meta?.policyName ?? 'your policy';

    await sendPolicyDocumentRequestEmail(email, claimId, policyName);

    await prisma.auditLog.create({
        data: { userId: adminId, action: `POLICY_DOCS_REQUESTED:${claimId}` },
    });

    return claim;
};

// ── Approve Claim (with ephemeral doc cleanup) ────────────────────────────────
export const approveClaim = async (adminId: string, claimId: string) => {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error('Claim not found');
    if (claim.status !== ClaimStatus.PENDING) {
        throw new Error(`Claim is already ${claim.status.toLowerCase()}`);
    }

    // Delete any uploaded policy docs for this claim (ephemeral storage)
    const claimDocDir = path.join(__dirname, '../..', 'uploads', `claim-${claimId}`);
    if (fs.existsSync(claimDocDir)) {
        fs.rmSync(claimDocDir, { recursive: true, force: true });
        console.log(`[admin.service] Deleted claim docs at ${claimDocDir}`);
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

// ── Reject Claim (with ephemeral doc cleanup) ─────────────────────────────────
export const rejectClaim = async (adminId: string, claimId: string) => {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error('Claim not found');
    if (claim.status !== ClaimStatus.PENDING) {
        throw new Error(`Claim is already ${claim.status.toLowerCase()}`);
    }

    // Delete any uploaded policy docs for this claim (ephemeral storage)
    const claimDocDir = path.join(__dirname, '../..', 'uploads', `claim-${claimId}`);
    if (fs.existsSync(claimDocDir)) {
        fs.rmSync(claimDocDir, { recursive: true, force: true });
        console.log(`[admin.service] Deleted claim docs at ${claimDocDir}`);
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
