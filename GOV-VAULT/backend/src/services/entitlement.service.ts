import axios, { AxiosError } from 'axios';
import { PrismaClient } from '@prisma/client';
import FormData from 'form-data';
import stream from 'stream';

const prisma = new PrismaClient();

const entitlementProxy = axios.create({
    baseURL: process.env.ENTITLEMENT_SERVICE_URL || 'http://entitlement-service:4000',
    timeout: 5000,
});

// Helper for error normalization
const handleProxyError = (error: unknown) => {
    console.error("--- RAW PROXY ERROR ---", error);
    if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error('503:Entitlement service temporarily unavailable.');
        }
        if (error.code === 'ECONNABORTED') {
            throw new Error('503:Entitlement service timed out.');
        }
        if (error.response) {
            // Entitlement service returned an error (e.g. 400 validation)
            const status = error.response.status;
            // Normalize internal 500s so we don't leak stack traces
            if (status >= 500) {
                throw new Error('500:Entitlement processing failed.');
            }
            // Pass through 4xx errors cleanly
            const message = error.response.data?.error || 'Entitlement processing failed.';
            throw new Error(`${status}:${message}`);
        }
    }
    throw new Error('500:Entitlement processing failed.');
};

export const getPolicies = async (userId: string, userRole: string, memberId: string) => {
    // 1. Verify Ownership
    const member = await prisma.familyMember.findFirst({
        where: {
            id: memberId,
            family: { createdById: userId, status: 'APPROVED' }
        },
        include: { family: true }
    });

    if (!member) {
        throw new Error('403:Access denied. Member does not belong to your approved family.');
    }

    try {
        const response = await entitlementProxy.get(`/policies/${memberId}`, {
            headers: {
                'x-user-id': userId,
                'x-user-role': userRole
            }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const startClaim = async (userId: string, userRole: string, memberId: string, policyId: string, claimantName: string) => {
    // 1. Verify Ownership
    const member = await prisma.familyMember.findFirst({
        where: {
            id: memberId,
            family: { createdById: userId, status: 'APPROVED' }
        },
        include: { family: true }
    });

    if (!member) {
        throw new Error('403:Access denied. Member does not belong to your approved family.');
    }

    try {
        const response = await entitlementProxy.post('/claims/start', {
            memberId, policyId, claimantName
        }, {
            headers: {
                'x-user-id': userId,
                'x-user-role': userRole
            }
        });

        const { claimId } = response.data;

        try {
            await prisma.claim.create({
                data: {
                    id: claimId,
                    familyId: member.familyId,
                    memberId: member.id,
                    schemeId: policyId,
                    source: 'MANUAL',
                    status: 'INITIATED'
                }
            });
        } catch (prismaErr) {
            console.error("Local Claim Stub Creation Failed. Did the policy exist in backend DB?: ", prismaErr);
        }

        return response.data;
    } catch (error) {
        console.error("--- GATEWAY START CLAIM ERROR TRACE ---", error);
        handleProxyError(error);
    }
};

const verifyClaimOwnership = async (userId: string, claimId: string) => {
    // Join Claim -> Family -> User locally instead of blindly trusting proxy
    const localClaim = await prisma.claim.findFirst({
        where: {
            id: claimId,
            family: { createdById: userId, status: 'APPROVED' }
        }
    });

    if (!localClaim) {
        throw new Error('403:Access denied. Claim does not belong to your approved family.');
    }
    return localClaim;
};

export const uploadDocument = async (
    userId: string,
    userRole: string,
    claimId: string,
    documentType: string,
    fileBuffer: Buffer,
    fileName: string,
    mimetype: string
) => {
    await verifyClaimOwnership(userId, claimId);

    try {
        const form = new FormData();
        form.append('claimId', claimId);
        form.append('documentType', documentType);
        form.append('file', fileBuffer, { filename: fileName, contentType: mimetype });

        const response = await entitlementProxy.post('/claims/upload-document', form, {
            headers: {
                ...form.getHeaders(),
                'x-user-id': userId,
                'x-user-role': userRole
            }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const preVerifyClaim = async (userId: string, userRole: string, claimId: string) => {
    await verifyClaimOwnership(userId, claimId);

    try {
        const response = await entitlementProxy.post('/claims/pre-verify', { claimId }, {
            headers: {
                'x-user-id': userId,
                'x-user-role': userRole
            }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const submitClaim = async (
    userId: string,
    userRole: string,
    claimId: string,
    correlationId: string,
    ip: string,
    userAgent: string
) => {
    await verifyClaimOwnership(userId, claimId);

    try {
        const response = await entitlementProxy.post('/claims/submit', { claimId }, {
            headers: {
                'x-user-id': userId,
                'x-user-role': userRole,
                'x-correlation-id': correlationId,
                'x-forwarded-for': ip,
                'user-agent': userAgent
            }
        });

        // Optionally update the local stub status if needed
        // await prisma.claim.update({ where: { id: claimId }, data: { status: 'APPROVED' } });

        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const getClaimTimeline = async (userId: string, userRole: string, claimId: string) => {
    await verifyClaimOwnership(userId, claimId);

    try {
        const response = await entitlementProxy.get(`/claims/timeline/${claimId}`, {
            headers: {
                'x-user-id': userId,
                'x-user-role': userRole
            }
        });
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const markMemberDeceased = async (userId: string, memberId: string) => {
    // Verify the member belongs to an APPROVED family owned by this user
    const member = await prisma.familyMember.findFirst({
        where: {
            id: memberId,
            family: { createdById: userId, status: 'APPROVED' }
        }
    });
    if (!member) {
        throw new Error('403:Access denied. Member does not belong to your approved family.');
    }

    try {
        const response = await entitlementProxy.post(`/members/${memberId}/deceased`);
        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};

export const kycSubmitClaim = async (userId: string, userRole: string, claimId: string, kycMethod: string, claimType: string) => {
    await verifyClaimOwnership(userId, claimId);

    try {
        const response = await entitlementProxy.post('/claims/kyc-submit', {
            claimId, kycMethod, claimType
        }, {
            headers: {
                'x-user-id': userId,
                'x-user-role': userRole
            }
        });

        // Update local claim stub to SUBMITTED so it appears in admin queue
        await prisma.claim.update({
            where: { id: claimId },
            data: { status: 'PENDING' } // PENDING in backend = waiting admin
        }).catch(() => {}); // ignore if local stub doesn't exist

        return response.data;
    } catch (error) {
        handleProxyError(error);
    }
};
