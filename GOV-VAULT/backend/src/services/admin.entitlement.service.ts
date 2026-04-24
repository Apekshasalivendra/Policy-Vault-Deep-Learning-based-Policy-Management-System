import axios from 'axios';

const ENTITLEMENT_SERVICE_URL = process.env.ENTITLEMENT_SERVICE_URL || 'http://entitlement-service:4000';

const adminClient = axios.create({
    baseURL: `${ENTITLEMENT_SERVICE_URL}/admin`,
    timeout: 5000,
});

const handleProxyError = (error: any) => {
    if (error.response) {
        throw new Error(`${error.response.status}:${error.response.data.error || 'Entitlement Service Error'}`);
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error(`503:Entitlement Service is currently unreachable.`);
    } else {
        throw new Error(`500:Internal Gateway Error connecting to Entitlement Service`);
    }
};

export const getSubmittedClaims = async (adminId: string, role: string) => {
    try {
        const response = await adminClient.get('/claims/submitted', {
            headers: { 'x-user-id': adminId, 'x-user-role': role }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const getClaimById = async (adminId: string, role: string, claimId: string) => {
    try {
        const response = await adminClient.get(`/claims/${claimId}`, {
            headers: { 'x-user-id': adminId, 'x-user-role': role }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const reviewClaim = async (adminId: string, role: string, claimId: string, correlationId: string, ip: string, userAgent: string) => {
    try {
        const response = await adminClient.post(`/claims/${claimId}/review`, {}, {
            headers: {
                'x-user-id': adminId,
                'x-user-role': role,
                'x-correlation-id': correlationId,
                'x-forwarded-for': ip,
                'user-agent': userAgent
            }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const approveClaim = async (adminId: string, role: string, claimId: string, correlationId: string, ip: string, userAgent: string) => {
    try {
        const response = await adminClient.post(`/claims/${claimId}/approve`, {}, {
            headers: {
                'x-user-id': adminId,
                'x-user-role': role,
                'x-correlation-id': correlationId,
                'x-forwarded-for': ip,
                'user-agent': userAgent
            }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const rejectClaim = async (adminId: string, role: string, claimId: string, correlationId: string, ip: string, userAgent: string) => {
    try {
        const response = await adminClient.post(`/claims/${claimId}/reject`, {}, {
            headers: {
                'x-user-id': adminId,
                'x-user-role': role,
                'x-correlation-id': correlationId,
                'x-forwarded-for': ip,
                'user-agent': userAgent
            }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const settleClaim = async (adminId: string, role: string, claimId: string, correlationId: string, ip: string, userAgent: string) => {
    try {
        const response = await adminClient.post(`/claims/${claimId}/settle`, {}, {
            headers: {
                'x-user-id': adminId,
                'x-user-role': role,
                'x-correlation-id': correlationId,
                'x-forwarded-for': ip,
                'user-agent': userAgent
            }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};
