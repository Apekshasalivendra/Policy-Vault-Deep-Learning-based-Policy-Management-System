import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json' },
    timeout: 120000,
});

// Request interceptor — attach JWT token to every request automatically
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handle 401 globally (token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
        if (error.response?.status === 401 && !isAuthRequest) {
            // Clear stale token and redirect to login
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('govvault_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authApi = {
    login: (email: string, password: string) =>
        api.post<{ token: string }>('/auth/login', { email, password }),
    register: (email: string, password: string) =>
        api.post('/auth/register', { email, password }),
    me: () => api.get('/auth/me'),
};

// ── Family endpoints ──────────────────────────────────────────────────────────
export const familyApi = {
    getMyFamily: () => api.get('/family/my'),
    create: (members: unknown[], aadhaarVerificationToken: string, state?: string, category?: string) =>
        api.post<{ family: { temporaryFamilyId: string; status: string } }>(
            '/family/create',
            { members, aadhaarVerificationToken, state, category }
        ),
    update: (members: unknown[], aadhaarVerificationToken?: string) =>
        api.put<{ family: { temporaryFamilyId: string; status: string } }>(
            '/family/update',
            { members, aadhaarVerificationToken }
        ),
};


// ── Claims endpoints ──────────────────────────────────────────────────────────
export const claimApi = {
    getMyClaims: () => api.get('/claim/my'),
    initiateClaim: (memberId: string, schemeId: string) =>
        api.post('/claim/initiate', { memberId, schemeId }),
    getClaimById: (id: string) => api.get(`/claim/${id}`),
};

// ── Entitlements endpoints (Gateway Phase 4 & 5) ─────────────────────────────
export const entitlementApi = {
    getPolicies: (memberId: string) => api.get(`/entitlements/policies/${memberId}`),
    markDeceased: (memberId: string) => api.post(`/entitlements/members/${memberId}/deceased`),
    startClaim: (memberId: string, policyId: string, claimantName: string) =>
        api.post<{ claimId: string; status: string }>('/entitlements/claims/start', { memberId, policyId, claimantName }),
    uploadDocument: (formData: FormData) =>
        api.post('/entitlements/claims/upload-document', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    preVerify: (claimId: string) =>
        api.post('/entitlements/claims/pre-verify', { claimId }),
    submitClaim: (claimId: string) =>
        api.post('/entitlements/claims/submit', { claimId }),
    getTimeline: (claimId: string) =>
        api.get(`/entitlements/claims/timeline/${claimId}`),
    kycSubmitClaim: (claimId: string, kycMethod: string, claimType: string) =>
        api.post('/entitlements/claims/kyc-submit', { claimId, kycMethod, claimType }),

    // --- Phase 6 Admin Domain Extensions ---
    adminGetSubmitted: () =>
        api.get('/admin/entitlements/claims/submitted'),
    adminGetClaimById: (claimId: string) =>
        api.get(`/admin/entitlements/claims/${claimId}`),
    adminReview: (claimId: string) =>
        api.post(`/admin/entitlements/claims/${claimId}/review`),
    adminApprove: (claimId: string) =>
        api.post(`/admin/entitlements/claims/${claimId}/approve`),
    adminReject: (claimId: string) =>
        api.post(`/admin/entitlements/claims/${claimId}/reject`),
    adminSettle: (claimId: string) =>
        api.post(`/admin/entitlements/claims/${claimId}/settle`),

    // --- Death Reporting Flow ---
    reportDeath: (memberId: string, policyId: string, reportedByUserId: string) =>
        api.post('/entitlements/death-reports', { memberId, policyId, reportedByUserId }),
    adminGetDeathReports: () =>
        api.get('/admin/entitlements/death-reports'),
    adminVerifyDeath: (id: string) =>
        api.post(`/admin/entitlements/death-reports/${id}/verify`),
    adminRejectDeath: (id: string) =>
        api.post(`/admin/entitlements/death-reports/${id}/reject`)
};

// ── Mock / Verification endpoints ───────────────────────────────────────────
export const mockApi = {
    verifyAadhaar: (aadhaar: string) =>
        api.post<{ otp: string; message: string }>('/mock/verify-aadhaar', { aadhaar }),
    confirmAadhaar: (aadhaar: string, otp: string) =>
        api.post<{ verificationToken: string }>('/mock/confirm-aadhaar', { aadhaar, otp }),
    verifyPan: (pan: string) =>
        api.post<{ verified: boolean; message: string }>('/mock/verify-pan', { pan }),
};

// ── Recommendations endpoints ─────────────────────────────────────────────────
export const recommendationApi = {
    get: (overrides?: { state?: string; gender?: string; category?: string }) =>
        api.post('/recommendations', overrides ?? {}),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────
export const adminApi = {
    getDashboard: () => api.get('/admin/dashboard'),
    getFamilies: () => api.get('/admin/families'),
    getPendingFamilies: () => api.get('/admin/families/pending'),
    approveFamily: (id: string) => api.post(`/admin/family/${id}/approve`),
    rejectFamily: (id: string) => api.post(`/admin/family/${id}/reject`),
    requestDocs: (id: string) => api.post(`/admin/family/${id}/request-docs`),
    getPendingClaims: () => api.get('/admin/claims/pending'),
    approveClaim: (id: string) => api.post(`/admin/claim/${id}/approve`),
    rejectClaim: (id: string) => api.post(`/admin/claim/${id}/reject`),
    getPendingPolicyClaims: () => api.get('/admin/policy-claims/pending'),
    approvePolicyClaim: (id: string) => api.post(`/admin/policy-claim/${id}/approve`),
    rejectPolicyClaim: (id: string) => api.post(`/admin/policy-claim/${id}/reject`),
    requestPolicyDocs: (id: string) => api.post(`/admin/policy-claim/${id}/request-docs`),
    getAnalytics: () => api.get('/admin/analytics/recommendations'),
    getAuditLogs: () => api.get('/admin/audit-logs'),
    getFamilyDocuments: (id: string) => api.get(`/api/families/${id}/documents`),
    getOrphans: () => api.get('/admin/orphans'),
    registerOrphan: (data: any) => api.post('/admin/orphans', data),
    verifyOrphan: (id: string, status: string) => api.post(`/admin/orphans/${id}/verify`, { status }),
    deductOrphanFund: (id: string, data: any) => api.post(`/admin/orphans/${id}/deduct-fee`, data),
};

// ── Policies endpoints (mock family policies) ─────────────────────────────────
export const policyApi = {
    getForFamily: (familyId: string) => api.get(`/policies/family/${familyId}`),
    submitClaim: (familyId: string, data: {
        policyId: string;
        policyName: string;
        memberId: string;
        memberName: string;
        percentage: number;
        nominees: unknown[];
    }) => api.post(`/policies/family/${familyId}/claim`, data),
};

export default api;
