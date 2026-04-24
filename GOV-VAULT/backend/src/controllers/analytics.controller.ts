import { Request, Response } from 'express';
import { getRecommendationAnalytics } from '../services/recommendationLog.service';

// ── GET /admin/analytics/recommendations ──────────────────────────────────────
// Returns aggregated recommendation intelligence metrics.
// No Aadhaar, PAN, or sensitive fields exposed — data safety enforced at service layer.
export const getRecommendationAnalyticsHandler = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const analytics = await getRecommendationAnalytics();
        res.json(analytics);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load analytics';
        console.error('[analytics.controller] Error:', message);
        res.status(500).json({ error: message });
    }
};
