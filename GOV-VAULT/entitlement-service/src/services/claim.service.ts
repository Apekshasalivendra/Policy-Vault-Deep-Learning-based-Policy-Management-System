import { PrismaClient, ClaimStatus, PreVerifyStatus, ClaimType, DocumentType } from '@prisma/client';
import { getPoliciesForMember } from './policy.service';

const prisma = new PrismaClient();

// Helper to calculate the next sequence number for a claim's timeline
async function getNextSequence(claimId: string): Promise<number> {
    const latest = await prisma.claimTimeline.findFirst({
        where: { claimId },
        orderBy: { sequence: 'desc' }
    });
    return latest ? latest.sequence + 1 : 1;
}

export const startClaimLogic = async (memberId: string, policyId: string, claimantName: string) => {
    // 1. Verify Member & Policy combination is claimable
    const memberData = await getPoliciesForMember(memberId);
    if (!memberData) throw new Error("Member not found");

    const targetPolicy = memberData.policies.find(p => p.policyId === policyId);
    if (!targetPolicy) throw new Error("Policy not found for member");
    if (!targetPolicy.isClaimable) throw new Error("Policy is not currently claimable");

    // 2. Prevent duplicate active claims
    const existingActiveClaim = await prisma.structuredClaim.findFirst({
        where: {
            memberId,
            policyId,
            isClosed: false,
            status: {
                notIn: [ClaimStatus.REJECTED, ClaimStatus.SETTLED]
            }
        }
    });

    if (existingActiveClaim) {
        throw new Error("An active claim already exists for this policy");
    }

    // 3. Determine ClaimType safely cast to enum
    const determinedClaimType = targetPolicy.claimType === "NOMINEE"
        ? ClaimType.NOMINEE
        : ClaimType.LEGAL_HEIR_REQUIRED;

    // 4. Create the StructuredClaim inside a Transaction to ensure Timeline integrity
    const result = await prisma.$transaction(async (tx) => {
        const claim = await tx.structuredClaim.create({
            data: {
                memberId,
                policyId,
                claimantName,
                claimType: determinedClaimType,
                status: ClaimStatus.INITIATED
            }
        });

        await tx.claimTimeline.create({
            data: {
                claimId: claim.id,
                status: ClaimStatus.INITIATED,
                sequence: 1,
                note: "Claim successfully initiated"
            }
        });

        return claim;
    });

    return {
        claimId: result.id,
        status: result.status
    };
};

export const uploadDocumentLogic = async (claimId: string, documentTypeStr: string, filePath: string) => {
    const claim = await prisma.structuredClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error("Claim not found");
    if (claim.status !== ClaimStatus.INITIATED && claim.status !== ClaimStatus.DOCUMENTS_PENDING) {
        throw new Error("Documents can only be uploaded in INITIATED or DOCUMENTS_PENDING states");
    }

    // Protect Enum Casting
    if (!Object.values(DocumentType).includes(documentTypeStr as any)) {
        throw new Error(`Invalid document type. Must be one of: ${Object.values(DocumentType).join(', ')}`);
    }

    const docTypeEnm = documentTypeStr as DocumentType;

    const result = await prisma.$transaction(async (tx) => {
        // Save the document
        await tx.claimDocument.create({
            data: {
                claimId,
                documentType: docTypeEnm,
                filePath
            }
        });

        const seq = await getNextSequence(claimId);

        // Update State to DOCUMENTS_PENDING if it was just INITIATED
        if (claim.status === ClaimStatus.INITIATED) {
            await tx.structuredClaim.update({
                where: { id: claimId },
                data: { status: ClaimStatus.DOCUMENTS_PENDING }
            });

            await tx.claimTimeline.create({
                data: {
                    claimId,
                    status: ClaimStatus.DOCUMENTS_PENDING,
                    sequence: seq,
                    note: `Document ${docTypeEnm} uploaded. Waiting for further documents or pre-verification.`
                }
            });
        } else {
            await tx.claimTimeline.create({
                data: {
                    claimId,
                    status: ClaimStatus.DOCUMENTS_PENDING,
                    sequence: seq,
                    note: `Document ${docTypeEnm} uploaded.`
                }
            });
        }

        return { success: true, message: `Document ${docTypeEnm} recorded.` };
    });

    return result;
};

export const preVerifyLogic = async (claimId: string) => {
    const claim = await prisma.structuredClaim.findUnique({
        where: { id: claimId },
        include: { documents: true, policy: { include: { nominees: true } } }
    });

    if (!claim) throw new Error("Claim not found");
    if (claim.status !== ClaimStatus.DOCUMENTS_PENDING) {
        throw new Error("Claim must be in DOCUMENTS_PENDING state to pre-verify");
    }

    let preVerifyStatus: PreVerifyStatus = PreVerifyStatus.CLEAN;
    let flagReason: string | null = null;

    // RULE 1: Nominee Matching
    if (claim.claimType === ClaimType.NOMINEE) {
        const aliveNominee = claim.policy.nominees.find(n => n.nomineeStatus === 'ALIVE');
        if (!aliveNominee || aliveNominee.nomineeName.toLowerCase() !== claim.claimantName.toLowerCase()) {
            preVerifyStatus = PreVerifyStatus.FLAGGED;
            flagReason = "Claimant name does not match the registered alive nominee.";
        }
    }

    // RULE 2: Legal Heir Verification
    if (claim.claimType === ClaimType.LEGAL_HEIR_REQUIRED) {
        const legalHeir = await prisma.legalHeir.findFirst({
            where: {
                memberId: claim.memberId,
                heirName: {
                    equals: claim.claimantName,
                    mode: 'insensitive' // case insensitive match
                },
                verified: true
            }
        });

        if (!legalHeir) {
            preVerifyStatus = PreVerifyStatus.FLAGGED;
            flagReason = "Claimant is not a verified legal heir for this member.";
        }
    }

    // RULE 3: Minimal Document Verification check (We just check if > 0 exists for now)
    if (claim.documents.length === 0) {
        preVerifyStatus = PreVerifyStatus.FLAGGED;
        flagReason = "No required documents uploaded.";
    }

    // Execute Result update
    const result = await prisma.$transaction(async (tx) => {
        const updatedClaim = await tx.structuredClaim.update({
            where: { id: claimId },
            data: {
                status: ClaimStatus.PRE_VERIFIED,
                preVerifyResult: preVerifyStatus
            }
        });

        const seq = await getNextSequence(claimId);
        await tx.claimTimeline.create({
            data: {
                claimId,
                status: ClaimStatus.PRE_VERIFIED,
                sequence: seq,
                note: preVerifyStatus === PreVerifyStatus.FLAGGED ? `Pre-verification FLAGGED: ${flagReason}` : `Pre-verification CLEAN. Ready for submission.`
            }
        });

        return updatedClaim;
    });

    return {
        preVerificationStatus: result.preVerifyResult,
        reason: flagReason
    };
};

export const submitClaimLogic = async (
    claimId: string,
    userId: string,
    userRole: string,
    correlationId?: string,
    ipAddress?: string,
    userAgent?: string
) => {
    const claim = await prisma.structuredClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error("Claim not found");

    if (claim.status !== ClaimStatus.PRE_VERIFIED) {
        throw new Error("Claim must be pre-verified before submission.");
    }

    if (claim.preVerifyResult !== PreVerifyStatus.CLEAN) {
        throw new Error("Cannot submit claim. Pre-verification result was not CLEAN.");
    }

    const result = await prisma.$transaction(async (tx) => {
        const submittedClaim = await tx.structuredClaim.update({
            where: { id: claimId },
            data: { status: ClaimStatus.SUBMITTED }
        });

        const seq = await getNextSequence(claimId);

        await tx.claimTimeline.create({
            data: {
                claimId,
                status: ClaimStatus.SUBMITTED,
                sequence: seq,
                note: "Claim submitted successfully to Admin queue."
            }
        });

        await tx.claimEventLog.create({
            data: {
                claimId,
                action: 'SUBMITTED',
                previousStatus: claim.status,
                newStatus: ClaimStatus.SUBMITTED,
                performedById: userId,
                performedByRole: userRole,
                ipAddress,
                userAgent,
                correlationId
            }
        });

        return submittedClaim;
    });

    return {
        claimId: result.id,
        status: result.status,
        message: "Claim submitted to Admin"
    };
};

export const getTimelineLogic = async (claimId: string) => {
    const claim = await prisma.structuredClaim.findUnique({
        where: { id: claimId },
        include: {
            timeline: {
                orderBy: { sequence: 'asc' }
            }
        }
    });

    if (!claim) throw new Error("Claim not found");

    return claim.timeline;
};

export const kycSubmitLogic = async (claimId: string, kycMethod: string, claimType: string) => {
    const claim = await prisma.structuredClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new Error("Claim not found");

    if (claim.isClosed) throw new Error("Claim is already closed.");

    // If already submitted or further, just return current state
    if (['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED'].includes(claim.status)) {
        return { claimId, status: claim.status, message: "Claim already in admin queue" };
    }

    const result = await prisma.$transaction(async (tx) => {
        // Update claim to SUBMITTED with preVerify marked CLEAN (KYC acts as verification)
        const updatedClaim = await tx.structuredClaim.update({
            where: { id: claimId },
            data: {
                status: ClaimStatus.SUBMITTED,
                preVerifyResult: PreVerifyStatus.CLEAN,
            }
        });

        const seq2 = await getNextSequence(claimId);
        await tx.claimTimeline.create({
            data: {
                claimId,
                status: ClaimStatus.SUBMITTED,
                sequence: seq2,
                note: `KYC completed via ${kycMethod}. Claim type: ${claimType}. Submitted to admin review queue.`
            }
        });

        return updatedClaim;
    });

    return {
        claimId: result.id,
        status: result.status,
        message: "Claim submitted to Admin review queue"
    };
};
