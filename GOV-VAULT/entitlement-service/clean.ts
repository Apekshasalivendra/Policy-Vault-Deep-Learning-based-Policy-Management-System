import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
    console.log("Injecting MemberStatus into Entitlement Service...");

    await prisma.memberStatus.upsert({
        where: { memberId: 'test-gateway-member' },
        update: { isDeceased: true },
        create: {
            memberId: 'test-gateway-member',
            isDeceased: true
        }
    });

    await prisma.policyRegistry.create({
        data: {
            memberId: 'test-gateway-member',
            policyType: 'SUBSIDY',
            issuingAuthority: 'TEST_GATEWAY_AUTHORITY',
            status: 'DECEASED_PENDING',
            nominees: {
                create: {
                    nomineeName: 'Gateway Proxy User',
                    nomineeRelation: 'Son',
                    nomineeStatus: 'ALIVE'
                }
            }
        }
    });

    console.log("Mock Entitlement Policy Generated.");
}

clean().catch(console.error).finally(() => prisma.$disconnect());
