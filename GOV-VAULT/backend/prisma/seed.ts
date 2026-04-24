import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const users = [
    {
        email: 'admin@govvault.in',
        password: 'Admin@123',
        role: Role.ADMIN,
    },
    {
        email: 'aarav.sharma@govvault.in',
        password: 'User@1234',
        role: Role.USER,
    },
    {
        email: 'priya.nair@govvault.in',
        password: 'User@1234',
        role: Role.USER,
    },
    {
        email: 'rohit.verma@govvault.in',
        password: 'User@1234',
        role: Role.USER,
    },
];

async function main() {
    console.log('🌱 Seeding GOV-VAULT database...\n');

    for (const userData of users) {
        const hashed = await bcrypt.hash(userData.password, SALT_ROUNDS);

        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: {
                email: userData.email,
                password: hashed,
                role: userData.role,
            },
        });

        await prisma.auditLog.create({
            data: { userId: user.id, action: 'SEED_CREATED' },
        });

        console.log(`✅ ${user.role.padEnd(5)} — ${user.email}`);
    }

    console.log('\n✔ Seed complete.');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
