import { PrismaClient, DeathReportStatus, PolicyStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// REPORT DEATH
// Validates: member has an ACTIVE/MATURED policy, no duplicate report pending
// ─────────────────────────────────────────────────────────────────────────────
export async function reportDeath(
    memberId: string,
    policyId: string,
    reportedByUserId: string,
    notes?: string,
) {
    // 1. Verify policy belongs to this member
    const policy = await prisma.policyRegistry.findFirst({
        where: { id: policyId, memberId },
    });

    if (!policy) {
        throw new Error('Policy not found or does not belong to this member.');
    }

    // 2. Verify policy is in a claimable state
    const claimableStatuses: PolicyStatus[] = [
        PolicyStatus.ACTIVE,
        PolicyStatus.MATURED,
        PolicyStatus.DECEASED_PENDING,
    ];
    if (!claimableStatuses.includes(policy.status)) {
        throw new Error(
            `Cannot report death for a policy with status "${policy.status}".`,
        );
    }

    // 3. Check for existing open death report
    const existing = await prisma.deathReport.findFirst({
        where: {
            policyId,
            memberId,
            status: { in: [DeathReportStatus.REPORTED, DeathReportStatus.UNDER_REVIEW] },
        },
    });
    if (existing) {
        throw new Error('A death report for this policy is already under review.');
    }

    // 4. Create the death report
    const report = await prisma.deathReport.create({
        data: { memberId, policyId, reportedByUserId, notes },
    });

    // 5. Update policy status
    await prisma.policyRegistry.update({
        where: { id: policyId },
        data: { status: PolicyStatus.DEATH_REPORTED },
    });

    // 6. Mark MemberStatus as deceased
    await prisma.memberStatus.upsert({
        where: { memberId },
        update: { isDeceased: true },
        create: { memberId, isDeceased: true },
    });

    return report;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL DEATH REPORTS (admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function getAllDeathReports() {
    return prisma.deathReport.findMany({
        include: { policy: { select: { policyType: true, policyName: true, issuingAuthority: true } } },
        orderBy: { reportedAt: 'desc' },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY DEATH (admin) → sets policy to CLAIM_ELIGIBLE
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyDeath(reportId: string) {
    const report = await prisma.deathReport.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Death report not found.');
    if (report.status === DeathReportStatus.VERIFIED) throw new Error('Already verified.');

    const [updatedReport] = await prisma.$transaction([
        prisma.deathReport.update({
            where: { id: reportId },
            data: { status: DeathReportStatus.VERIFIED, verifiedAt: new Date() },
        }),
        prisma.policyRegistry.update({
            where: { id: report.policyId },
            data: { status: PolicyStatus.CLAIM_ELIGIBLE },
        }),
    ]);

    return updatedReport;
}

// ─────────────────────────────────────────────────────────────────────────────
// REJECT DEATH (admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function rejectDeath(reportId: string, notes?: string) {
    const report = await prisma.deathReport.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Death report not found.');

    const [updatedReport] = await prisma.$transaction([
        prisma.deathReport.update({
            where: { id: reportId },
            data: { status: DeathReportStatus.REJECTED, notes: notes ?? report.notes },
        }),
        // Revert policy back to ACTIVE
        prisma.policyRegistry.update({
            where: { id: report.policyId },
            data: { status: PolicyStatus.ACTIVE },
        }),
        // Revert member death flag
        prisma.memberStatus.upsert({
            where: { memberId: report.memberId },
            update: { isDeceased: false },
            create: { memberId: report.memberId, isDeceased: false },
        }),
    ]);

    return updatedReport;
}
