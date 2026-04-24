import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Bulk-register member IDs into the MemberStatus table.
 * Uses upsert so it is safe to call repeatedly (idempotent).
 */
export const registerMembers = async (memberIds: string[]): Promise<void> => {
    for (const memberId of memberIds) {
        await prisma.memberStatus.upsert({
            where: { memberId },
            update: {},          // already registered — leave deceased flag untouched
            create: { memberId, isDeceased: false },
        });
    }
};

/**
 * Mark a member as deceased.
 * Returns the updated record, or throws if not found.
 */
export const markMemberDeceased = async (memberId: string) => {
    const existing = await prisma.memberStatus.findUnique({ where: { memberId } });
    if (!existing) {
        throw new Error('Member not found in entitlement registry');
    }
    if (existing.isDeceased) {
        throw new Error('Member is already marked as deceased');
    }
    return prisma.memberStatus.update({
        where: { memberId },
        data: { isDeceased: true },
    });
};
