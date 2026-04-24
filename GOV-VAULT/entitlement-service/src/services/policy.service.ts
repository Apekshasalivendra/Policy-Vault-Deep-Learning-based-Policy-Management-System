import { PrismaClient, PolicyStatus, NomineeStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const getPoliciesForMember = async (memberId: string) => {
    // 1. Fetch member status to see if they exist and if they are deceased
    const memberStatus = await prisma.memberStatus.findUnique({
        where: { memberId }
    });

    if (!memberStatus) {
        return null; // Return null to let the controller dispatch a 404
    }

    const isDeceased = memberStatus.isDeceased;

    // 2. Fetch all PolicyRegistry records for that member incl. Nominees
    const policies = await prisma.policyRegistry.findMany({
        where: { memberId },
        include: { nominees: true }
    });

    // 3. Process each policy based on business logic rules
    const processedPolicies = policies.map((policy) => {
        const nominee = policy.nominees.length > 0 ? policy.nominees[0] : null;

        // Determine claimType
        let claimType = "LEGAL_HEIR_REQUIRED";
        if (nominee && nominee.nomineeStatus === NomineeStatus.ALIVE) {
            claimType = "NOMINEE";
        }

        // Determine isClaimable
        let isClaimable = false;

        if (!isDeceased) {
            // Rule 1 — Member Alive: Only MATURED policies are claimable
            if (policy.status === PolicyStatus.MATURED) {
                isClaimable = true;
            }
        } else {
            // Rule 2 — Member Deceased: ACTIVE or DECEASED_PENDING policies are claimable
            if (policy.status === PolicyStatus.ACTIVE || policy.status === PolicyStatus.DECEASED_PENDING) {
                isClaimable = true;
            }
        }

        return {
            policyId: policy.id,
            policyType: policy.policyType,
            issuingAuthority: policy.issuingAuthority,
            status: policy.status,
            nominee: nominee ? {
                name: nominee.nomineeName,
                relation: nominee.nomineeRelation,
                status: nominee.nomineeStatus
            } : null,
            claimType,
            isClaimable
        };
    });

    return {
        memberId,
        policies: processedPolicies
    };
};
