import axios, { AxiosError } from 'axios';
import { logRecommendation } from './recommendationLog.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT_MS = 60000; // 60s — Groq LLM inference / Pinecone can take longer on cold starts

export interface SchemeRecommendation {
    schemeId: string;
    schemeName: string;
    benefitSummary: string;
    eligibilityReason: string;
    source: string;
    recommendedAt: string;
}

export interface RecommendationPayload {
    state: string;
    incomeRange: string;
    occupation: string;
    age: number;
    gender: string;
    category: string;
    familySize: number;
}

export interface RecommendationResult {
    schemes: SchemeRecommendation[];
    unavailable?: boolean;
    message?: string;
}

export const getRecommendations = async (
    payload: RecommendationPayload,
    userId: string,
    familyId: string
): Promise<RecommendationResult> => {
    try {
        const response = await axios.post<{ count: number; schemes: SchemeRecommendation[] }>(
            `${AI_SERVICE_URL}/recommend`,
            payload,
            {
                timeout: AI_TIMEOUT_MS,
                headers: { 'Content-Type': 'application/json' },
            }
        );
        const schemes = response.data.schemes;

        // Phase 5 — persist recommendation snapshot
        // inputSnapshot: ONLY state, incomeRange, occupation, age, gender, category, familySize
        // NO Aadhaar, PAN, or any encrypted fields stored
        logRecommendation({
            userId,
            familyId,
            inputSnapshot: payload as unknown as Record<string, unknown>,
            schemesSnapshot: schemes,
        }).catch((err) => {
            // Non-fatal — log persistence must never affect user response
            console.error('[recommendation.service] Failed to persist recommendation log:', err?.message);
        });

        return { schemes };
    } catch (err) {
        const axiosErr = err as AxiosError;

        // Structured logging per error type — never silent
        if (axiosErr.code === 'ECONNABORTED') {
            console.error('[recommendation.service] AI service timeout after 5s:', axiosErr.message);
        } else if (axiosErr.code === 'ECONNREFUSED') {
            console.error('[recommendation.service] AI service unreachable (ECONNREFUSED):', axiosErr.message);
        } else {
            console.error('[recommendation.service] AI service error:', axiosErr.message);
        }

        // Graceful fallback — backend never crashes because of AI service
        return {
            unavailable: true,
            schemes: [],
            message: 'Scheme recommendation service is temporarily unavailable. Please try again shortly.',
        };
    }
};
