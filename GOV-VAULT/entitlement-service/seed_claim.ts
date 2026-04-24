import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // We need a PolicyRegistry entry first to satisfy constraints?
    // Wait, StructuredClaim has a relation to PolicyRegistry. So we need to create one first.

    // Check if there are any existing policies
    const policy = await prisma.policyRegistry.create({
        data: {
            memberId: 'mock-member-1',
            policyType: 'INSURANCE',
            issuingAuthority: 'LIC',
            status: 'ACTIVE'
        }
    });

    const claim = await prisma.structuredClaim.create({
        data: {
            memberId: 'mock-member-1',
            policyId: policy.id,
            claimantName: 'John Doe',
            claimType: 'NOMINEE',
            status: 'SUBMITTED', // Set it to SUBMITTED so the admin can review it
        }
    });

    // Also add a timeline event to satisfy sequence counting
    await prisma.claimTimeline.create({
        data: {
            claimId: claim.id,
            status: 'SUBMITTED',
            sequence: 1,
            note: 'Mock claim submitted'
        }
    });

    console.log(`Mock claim created: ${claim.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
