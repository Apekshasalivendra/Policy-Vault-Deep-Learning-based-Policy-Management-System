import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
    console.log("Inspecting StructuredClaims...");
    const claims = await prisma.structuredClaim.findMany({
        where: { memberId: 'test-gateway-member' }
    });
    console.log("Found Claims for test-gateway-member:", claims.length);
    console.dir(claims, { depth: null });
}

inspect().catch(console.error).finally(() => prisma.$disconnect());
