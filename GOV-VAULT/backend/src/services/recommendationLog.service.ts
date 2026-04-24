import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ── Log Recommendation ─────────────────────────────────────────────────────────
// Stores a snapshot of what was sent to the AI and what it returned.
// DATA SAFETY: inputSnapshot must NEVER contain Aadhaar, PAN, or encrypted fields.
// Only store: state, incomeRange, occupation, age, gender, category, familySize.
export const logRecommendation = async (params: {
    userId: string;
    familyId: string;
    inputSnapshot: Record<string, unknown>;
    schemesSnapshot: unknown[];
}) => {
    return prisma.recommendationLog.create({
        data: {
            userId: params.userId,
            familyId: params.familyId,
            // Cast to Prisma.InputJsonValue to satisfy strict Json type
            inputSnapshot: params.inputSnapshot as Prisma.InputJsonValue,
            schemesSnapshot: params.schemesSnapshot as Prisma.InputJsonValue,
        },
    });
};


// ── Check Recent Recommendation ────────────────────────────────────────────────
// Used by claim service: did the AI recommend this scheme for this user
// within the last 7 days? Returns true/false.
export const wasSchemeAiRecommended = async (
    userId: string,
    familyId: string,
    schemeId: string
): Promise<boolean> => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const log = await prisma.recommendationLog.findFirst({
        where: {
            userId,
            familyId,
            createdAt: { gte: since },
        },
        select: { schemesSnapshot: true },
    });

    if (!log) return false;

    // schemesSnapshot is a JSON array of scheme objects with schemeId field
    const schemes = log.schemesSnapshot as Array<{ schemeId?: string }>;
    return schemes.some((s) => s.schemeId === schemeId);
};

// ── Admin Analytics ────────────────────────────────────────────────────────────
export const getRecommendationAnalytics = async () => {
    const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Run all aggregate queries in parallel
    const [
        totalRecommendations,
        recommendationsLast7Days,
        totalAiDrivenClaims,
        totalManualClaims,
        allLogs,
    ] = await Promise.all([
        prisma.recommendationLog.count(),
        prisma.recommendationLog.count({ where: { createdAt: { gte: since7Days } } }),
        prisma.claim.count({ where: { source: 'AI_RECOMMENDED' } }),
        prisma.claim.count({ where: { source: 'MANUAL' } }),
        // Fetch snapshots to compute topRecommendedSchemes in-memory
        // (Postgres JSON aggregation in Prisma requires raw queries — this is safer for prototype)
        prisma.recommendationLog.findMany({
            select: { schemesSnapshot: true },
        }),
    ]);

    // Tally scheme occurrences from all snapshots
    const schemeCounts: Record<string, number> = {};
    for (const log of allLogs) {
        const schemes = log.schemesSnapshot as Array<{ schemeId?: string; schemeName?: string }>;
        for (const s of schemes) {
            if (!s.schemeId) continue;
            const key = `${s.schemeId}::${s.schemeName || ''}`;
            schemeCounts[key] = (schemeCounts[key] || 0) + 1;
        }
    }

    // Top 10 most recommended schemes
    const topRecommendedSchemes = Object.entries(schemeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([key, count]) => {
            const [schemeId, schemeName] = key.split('::');
            return { schemeId, schemeName, count };
        });

    // Conversion rate: AI-driven claims / total recommendations (avoid divide-by-zero)
    const recommendationToClaimConversionRate =
        totalRecommendations > 0
            ? Number(((totalAiDrivenClaims / totalRecommendations) * 100).toFixed(2))
            : 0;

    return {
        totalRecommendations,
        recommendationsLast7Days,
        topRecommendedSchemes,
        recommendationToClaimConversionRate,
        totalAiDrivenClaims,
        totalManualClaims,
    };
};
