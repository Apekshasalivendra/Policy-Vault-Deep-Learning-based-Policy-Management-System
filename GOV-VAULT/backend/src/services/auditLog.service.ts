import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Get Last 100 Audit Logs ────────────────────────────────────────────────────
// Returns logs with user email joined — NO Aadhaar, PAN, or sensitive data.
export const getAuditLogs = async () => {
    return prisma.auditLog.findMany({
        take: 100,
        orderBy: { timestamp: 'desc' },
        include: {
            user: { select: { email: true } },
        },
    });
};
