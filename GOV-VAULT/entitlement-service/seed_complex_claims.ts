import { PrismaClient, PolicyType, PolicyStatus, ClaimType, ClaimStatus, PreVerifyStatus, VerificationMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing old claims and policies...');
    await prisma.claimEventLog.deleteMany({});
    await prisma.claimTimeline.deleteMany({});
    await prisma.claimDocument.deleteMany({});
    await prisma.structuredClaim.deleteMany({});
    await prisma.nominee.deleteMany({});
    await prisma.policyRegistry.deleteMany({});

    console.log('Generating 55 complex claim scenarios...');

    const baseUsers = Array.from({ length: 20 }, (_, i) => `user-${i + 1}`);
    let claimCounter = 0;

    // Helper to generate a claim
    const createScenario = async (
        type: 'ALIVE' | 'DEATH_ADULT' | 'DEATH_MINOR' | 'LEGAL_HEIR' | 'FRAUD',
        count: number
    ) => {
        for (let i = 0; i < count; i++) {
            claimCounter++;
            const memberId = baseUsers[i % baseUsers.length];

            // 1. Create Policy
            const policy = await prisma.policyRegistry.create({
                data: {
                    memberId,
                    policyType: type === 'ALIVE' ? PolicyType.SUBSIDY : PolicyType.INSURANCE,
                    issuingAuthority: 'GovVault Insurance Dept',
                    policyName: type === 'ALIVE' ? 'Health Subsidy' : 'Jeevan Bima Life Insurance',
                    status: type === 'ALIVE' ? PolicyStatus.ACTIVE : PolicyStatus.DECEASED_PENDING,
                }
            });

            // Determine specific fields based on type
            let claimantName = 'Unknown';
            let claimType: ClaimType = ClaimType.NOMINEE;
            let status: ClaimStatus = ClaimStatus.UNDER_ADMIN_REVIEW;
            let bankMethod: VerificationMethod = i % 2 === 0 ? VerificationMethod.RAZORPAY_AUTOMATED : VerificationMethod.MANUAL_DOCUMENT;
            let isIdentityVerified = true;
            let isBankVerified = bankMethod === VerificationMethod.RAZORPAY_AUTOMATED;
            let isDeathVerified: boolean | null = true;
            let isRelationshipVerified: boolean | null = true;
            let claimantRole = 'NOMINEE';
            let preVerifyResult: PreVerifyStatus = PreVerifyStatus.CLEAN;

            if (type === 'ALIVE') {
                claimantName = `Primary Owner ${i}`;
                claimantRole = 'OWNER';
                isDeathVerified = null; // Owner is alive
                isRelationshipVerified = null;
            } else if (type === 'DEATH_ADULT') {
                claimantName = `Adult Nominee ${i}`;
                await prisma.nominee.create({
                    data: { policyId: policy.id, nomineeName: claimantName, nomineeRelation: 'SPOUSE' }
                });
            } else if (type === 'DEATH_MINOR') {
                claimantName = `Minor Child ${i}`;
                claimantRole = 'GUARDIAN';
                isRelationshipVerified = false; // Admin needs to verify guardian manually
                await prisma.nominee.create({
                    data: { policyId: policy.id, nomineeName: claimantName, nomineeRelation: 'CHILD' }
                });
            } else if (type === 'LEGAL_HEIR') {
                claimantName = `Legal Heir ${i}`;
                claimType = ClaimType.LEGAL_HEIR_REQUIRED;
                claimantRole = 'LEGAL_HEIR';
                isRelationshipVerified = false; // Needs Succession Certificate verification
            } else if (type === 'FRAUD') {
                claimantName = `Suspicious Claimant ${i}`;
                bankMethod = VerificationMethod.RAZORPAY_AUTOMATED;
                isBankVerified = false;
                preVerifyResult = PreVerifyStatus.FLAGGED;
            }

            // 2. Create Claim
            const claim = await prisma.structuredClaim.create({
                data: {
                    memberId,
                    policyId: policy.id,
                    claimantName,
                    claimType,
                    status,
                    preVerifyResult,
                    isIdentityVerified,
                    isBankVerified,
                    isDeathVerified,
                    isRelationshipVerified,
                    bankVerificationMethod: bankMethod,
                    razorpayReferenceId: bankMethod === VerificationMethod.RAZORPAY_AUTOMATED ? `pay_rzp_${Date.now()}_${i}` : null,
                    claimantRole
                }
            });

            // 3. Add Timelines
            await prisma.claimTimeline.createMany({
                data: [
                    { claimId: claim.id, status: ClaimStatus.INITIATED, sequence: 1, note: 'Claim started' },
                    { claimId: claim.id, status: ClaimStatus.SUBMITTED, sequence: 2, note: 'Documents uploaded' },
                    { claimId: claim.id, status: ClaimStatus.UNDER_ADMIN_REVIEW, sequence: 3, note: 'Waiting for Admin approval' },
                ]
            });
            
            // Add a document for manual checks
            if (bankMethod === VerificationMethod.MANUAL_DOCUMENT || !isRelationshipVerified) {
                await prisma.claimDocument.create({
                    data: {
                        claimId: claim.id,
                        documentType: 'ID_PROOF',
                        filePath: '/uploads/dummy_proof.pdf'
                    }
                });
            }
        }
    };

    await createScenario('ALIVE', 15);
    console.log('✅ Generated 15 Alive Claims');
    
    await createScenario('DEATH_ADULT', 15);
    console.log('✅ Generated 15 Death Claims (Adult Nominees)');
    
    await createScenario('DEATH_MINOR', 10);
    console.log('✅ Generated 10 Death Claims (Minor Nominees)');
    
    await createScenario('LEGAL_HEIR', 10);
    console.log('✅ Generated 10 Death Claims (Legal Heirs)');
    
    await createScenario('FRAUD', 5);
    console.log('✅ Generated 5 Flagged/Suspicious Claims');

    console.log(`Total claims generated: ${claimCounter}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
