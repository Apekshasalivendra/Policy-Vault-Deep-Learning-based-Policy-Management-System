import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setup() {
    console.log("Setting up mock test data...");

    const user = await prisma.user.upsert({
        where: { email: 'aarav.sharma@govvault.in' },
        update: {},
        create: {
            email: 'aarav.sharma@govvault.in',
            password: await bcrypt.hash('User@1234', 12),
            role: 'USER'
        }
    });

    let family = await prisma.family.findFirst({ where: { createdById: user.id } });
    if (!family) {
        family = await prisma.family.create({
            data: {
                temporaryFamilyId: 'TEMP-AARAV-1',
                status: 'APPROVED',
                createdById: user.id
            }
        });
    }

    await prisma.familyMember.upsert({
        where: { id: 'test-gateway-member' },
        update: { familyId: family.id },
        create: {
            id: 'test-gateway-member',
            familyId: family.id,
            name: 'API Gateway Mock',
            phone: '9999999999',
            aadhaarEncrypted: 'mockAad',
            aadhaarHash: 'mockAadHash2',
            incomeRange: '0-2L',
            occupation: 'Farmer',
            age: 65,
            isAadhaarVerified: true
        }
    });

    console.log("Mock data injected. User ID:", user.id);
}

setup().catch(console.error).finally(() => prisma.$disconnect());
