const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const deceased = await prisma.memberStatus.findMany({
            where: { isDeceased: true }
        });
        console.log("Deceased Members:", deceased);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}
check();
