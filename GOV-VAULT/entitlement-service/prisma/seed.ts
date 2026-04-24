import { PrismaClient, PolicyType, PolicyStatus, NomineeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('[Seed] Starting Entitlement Service Seed...');

    // 1. Create Member Statuses
    // - "alive-member" is alive
    // - "deceased-member" is deceased
    console.log('[Seed] Seeding MemberStatus...');
    const memberAlive = await prisma.memberStatus.upsert({
        where: { memberId: 'alive-member' },
        update: {},
        create: {
            memberId: 'alive-member',
            isDeceased: false
        }
    });

    const memberDeceased = await prisma.memberStatus.upsert({
        where: { memberId: 'deceased-member' },
        update: {},
        create: {
            memberId: 'deceased-member',
            isDeceased: true
        }
    });

    console.log('[Seed] Seeding PolicyRegistry & Nominees...');

    // 2. Seed Policies for Alive Member
    // policy 1: ACTIVE (not claimable while alive)
    await prisma.policyRegistry.create({
        data: {
            memberId: memberAlive.memberId,
            policyType: PolicyType.INSURANCE,
            issuingAuthority: 'LIC',
            status: PolicyStatus.ACTIVE,
            nominees: {
                create: {
                    nomineeName: 'Rahul Kumar',
                    nomineeRelation: 'Brother',
                    nomineeStatus: NomineeStatus.ALIVE
                }
            }
        }
    });

    // policy 2: MATURED (claimable while alive)
    await prisma.policyRegistry.create({
        data: {
            memberId: memberAlive.memberId,
            policyType: PolicyType.PENSION,
            issuingAuthority: 'EPFO',
            status: PolicyStatus.MATURED,
            // no nominee
        }
    });

    // 3. Seed Policies for Deceased Member
    // policy 3: ACTIVE (claimable because member is deceased) with ALIVE nominee -> claimType = NOMINEE
    await prisma.policyRegistry.create({
        data: {
            memberId: memberDeceased.memberId,
            policyType: PolicyType.INSURANCE,
            issuingAuthority: 'SBI Life',
            status: PolicyStatus.ACTIVE,
            nominees: {
                create: {
                    nomineeName: 'Anita Sharma',
                    nomineeRelation: 'Spouse',
                    nomineeStatus: NomineeStatus.ALIVE
                }
            }
        }
    });

    // policy 4: DECEASED_PENDING (claimable) with DECEASED nominee -> claimType = LEGAL_HEIR_REQUIRED
    await prisma.policyRegistry.create({
        data: {
            memberId: memberDeceased.memberId,
            policyType: PolicyType.SUBSIDY,
            issuingAuthority: 'PM KISAN',
            status: PolicyStatus.DECEASED_PENDING,
            nominees: {
                create: {
                    nomineeName: 'Ramesh Sharma',
                    nomineeRelation: 'Father',
                    nomineeStatus: NomineeStatus.DECEASED
                }
            }
        }
    });

    // 4. Seed Legal Heir for Deceased Member (to test preVerify LEGAL_HEIR_REQUIRED)
    console.log('[Seed] Seeding LegalHeir...');
    await prisma.legalHeir.create({
        data: {
            memberId: memberDeceased.memberId,
            heirName: 'Sunita Sharma',
            heirRelation: 'Mother',
            verified: true
        }
    });

    console.log('[Seed] Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error('[Seed] Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
