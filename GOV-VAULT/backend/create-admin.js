// Quick admin creation script – run with: node create-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const hashed = await bcrypt.hash('Admin@123', 12);
    
    const user = await prisma.user.upsert({
        where: { email: 'admin@govvault.in' },
        update: { password: hashed, role: 'ADMIN' },
        create: { email: 'admin@govvault.in', password: hashed, role: 'ADMIN' },
    });

    console.log('✅ Admin user ready:', user.email, '| role:', user.role);

    // Also create some test users
    const testHash = await bcrypt.hash('User@1234', 12);
    for (const email of ['aarav.sharma@govvault.in', 'priya.nair@govvault.in']) {
        await prisma.user.upsert({
            where: { email },
            update: {},
            create: { email, password: testHash, role: 'USER' },
        });
        console.log('✅ User ready:', email);
    }
    
    await prisma.$disconnect();
}

main().catch(e => { console.error('❌', e); process.exit(1); });
