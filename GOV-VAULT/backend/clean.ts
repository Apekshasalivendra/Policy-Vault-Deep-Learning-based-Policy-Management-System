import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
    console.log("Cleaning claims...");
    await prisma.$executeRaw`DELETE FROM "ClaimDocument";`;
    await prisma.$executeRaw`DELETE FROM "ClaimTimeline";`;
    await prisma.$executeRaw`DELETE FROM "StructuredClaim";`;
    await prisma.$executeRaw`DELETE FROM "claims";`;
    console.log("Purge Complete.");
}

clean().catch(console.error).finally(() => prisma.$disconnect());
