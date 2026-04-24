const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
// Inside Docker, the service name is 'entitlement-service'
const ENTITLEMENT_SERVICE_URL = process.env.ENTITLEMENT_SERVICE_URL || 'http://entitlement-service:4000';

async function backfill() {
    console.log(`--- Starting Backfill to ${ENTITLEMENT_SERVICE_URL} ---`);
    try {
        const approvedFamilies = await prisma.family.findMany({
            where: { status: 'APPROVED' },
            include: { members: { select: { id: true } } }
        });

        const allMemberIds = approvedFamilies.flatMap(f => f.members.map(m => m.id));

        if (allMemberIds.length === 0) {
            console.log('No members found to backfill.');
            return;
        }

        console.log(`Found ${allMemberIds.length} members across ${approvedFamilies.length} families to register.`);

        // Split into chunks of 50
        for (let i = 0; i < allMemberIds.length; i += 50) {
            const chunk = allMemberIds.slice(i, i + 50);
            await axios.post(`${ENTITLEMENT_SERVICE_URL}/members/register`, { memberIds: chunk });
            console.log(`Registered chunk ${Math.floor(i/50) + 1} (${chunk.length} members)`);
        }

        console.log('--- Backfill Complete ---');
    } catch (err) {
        console.error('Backfill failed:', err.response?.data || err.message);
    } finally {
        await prisma.$disconnect();
    }
}

backfill();
