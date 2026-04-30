import { PrismaClient, FamilyStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { encrypt, decrypt } from '../utils/encryption';
import { hashValue } from '../utils/hash';

const prisma = new PrismaClient();

const MAX_MEMBERS = 8;
const MAX_FAMILIES_PER_USER_PER_DAY = 3;

interface MemberInput {
    nameAsInAadhaar: string;
    phoneAsInAadhaar: string;
    aadhaar: string;
    pan?: string;
    incomeRange: string;
    occupation: string;
    age: number;
    gender: string;
    religion: string;
    physicallyDisabled: boolean;
}

interface AadhaarVerificationPayload {
    aadhaar: string;
    verified: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a 12-digit numeric string with DB uniqueness guarantee */
async function generateUniqueFamilyId(): Promise<string> {
    while (true) {
        const id = Math.floor(100_000_000_000 + Math.random() * 900_000_000_000).toString();
        const existing = await prisma.family.findUnique({ where: { temporaryFamilyId: id } });
        if (!existing) return id;
    }
}

/** Decode and verify the Aadhaar verification JWT */
function decodeVerificationToken(token: string): AadhaarVerificationPayload {
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AadhaarVerificationPayload;
        if (!payload.verified || !payload.aadhaar) {
            throw new Error('Verification token is invalid');
        }
        return payload;
    } catch {
        throw new Error('Aadhaar verification token is missing, invalid, or expired');
    }
}

// ── Create Family ─────────────────────────────────────────────────────────────
export const createFamily = async (
    userId: string,
    members: MemberInput[],
    aadhaarVerificationToken: string,
    state?: string,
    category?: string
) => {
    // 1. Validate member count
    if (!members || members.length === 0) {
        throw new Error('At least one family member is required');
    }
    if (members.length > MAX_MEMBERS) {
        throw new Error(`A family can have at most ${MAX_MEMBERS} members`);
    }

    // 2. Validate Aadhaar verification token
    const { aadhaar: verifiedAadhaar } = decodeVerificationToken(aadhaarVerificationToken);

    // Ensure the verified Aadhaar matches the head-of-family (first member)
    const headMember = members[0];
    if (headMember.aadhaar !== verifiedAadhaar) {
        throw new Error(
            'Aadhaar verification token does not match the first member\'s Aadhaar'
        );
    }

    // 3. Per-user rate limit: max 3 family registrations per 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.family.count({
        where: { createdById: userId, createdAt: { gte: since } },
    });
    if (recentCount >= MAX_FAMILIES_PER_USER_PER_DAY) {
        throw new Error('Family creation limit reached (max 3 per 24 hours)');
    }

    // 4. Intra-family duplicate check (within the same request)
    const aadhaarSet = new Set<string>();
    const panSet = new Set<string>();
    for (const m of members) {
        const ah = hashValue(m.aadhaar);
        if (aadhaarSet.has(ah)) {
            throw new Error(`Duplicate Aadhaar found in request (member: ${m.nameAsInAadhaar})`);
        }
        aadhaarSet.add(ah);

        if (m.pan) {
            const ph = hashValue(m.pan);
            if (panSet.has(ph)) {
                throw new Error(`Duplicate PAN found in request (member: ${m.nameAsInAadhaar})`);
            }
            panSet.add(ph);
        }
    }

    // 5. Cross-family fraud check — compare hashes against existing DB records
    const aadhaarHashes = [...aadhaarSet];
    const panHashes = [...panSet];

    const existingByAadhaar = await prisma.familyMember.findFirst({
        where: { aadhaarHash: { in: aadhaarHashes } },
    });
    if (existingByAadhaar) {
        throw new Error('One or more Aadhaar numbers are already registered in another family');
    }

    if (panHashes.length > 0) {
        const existingByPan = await prisma.familyMember.findFirst({
            where: { panHash: { in: panHashes } },
        });
        if (existingByPan) {
            throw new Error('One or more PAN numbers are already registered in another family');
        }
    }

    // 6. Generate collision-safe 12-digit family ID
    const temporaryFamilyId = await generateUniqueFamilyId();

    // 7. Create family and members in a single transaction
    const family = await prisma.$transaction(async (tx) => {
        const newFamily = await tx.family.create({
            data: {
                temporaryFamilyId,
                status: FamilyStatus.PENDING,
                state: state || "Andhra Pradesh",
                category: category || "General",
                createdById: userId,
                members: {
                    create: members.map((m) => ({
                        nameAsInAadhaar: m.nameAsInAadhaar,
                        phoneAsInAadhaar: m.phoneAsInAadhaar,
                        aadhaarEncrypted: encrypt(m.aadhaar),
                        aadhaarHash: hashValue(m.aadhaar),
                        panEncrypted: m.pan ? encrypt(m.pan) : null,
                        panHash: m.pan ? hashValue(m.pan) : null,
                        incomeRange: m.incomeRange,
                        occupation: m.occupation,
                        age: m.age,
                        gender: m.gender,
                        religion: m.religion,
                        physicallyDisabled: m.physicallyDisabled,
                        isAadhaarVerified: true,  // verified via token
                        isPanVerified: false,      // PAN verified via format only
                    })),
                },
            },
            include: { members: true },
        });

        // Audit log
        await tx.auditLog.create({
            data: { userId, action: `FAMILY_CREATED:${newFamily.temporaryFamilyId}` },
        });

        return newFamily;
    });

    // Strip encrypted fields from response
    const { members: memberRows, ...familyData } = family;
    return {
        ...familyData,
        memberCount: memberRows.length,
    };
};

// ── Get Family (by ID) ────────────────────────────────────────────────────────
export const getFamilyById = async (familyId: string, userId: string) => {
    const family = await prisma.family.findFirst({
        where: { id: familyId, createdById: userId },
        include: {
            members: {
                select: {
                    id: true, nameAsInAadhaar: true, phoneAsInAadhaar: true, incomeRange: true,
                    occupation: true, age: true, gender: true, religion: true, physicallyDisabled: true, isAadhaarVerified: true, isPanVerified: true, createdAt: true,
                },
            },
        },
    });
    if (!family) throw new Error('Family not found');
    return family;
};

// ── Get My Family (user dashboard) ───────────────────────────────────────────
// Returns the user's own family with Aadhaar/PAN decrypted.
// NEVER exposes aadhaarHash, panHash, aadhaarEncrypted, panEncrypted.
export const getMyFamily = async (userId: string) => {
    const family = await prisma.family.findFirst({
        where: { createdById: userId },
        include: {
            members: true, // fetch all fields so we can decrypt
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!family) throw new Error('No family found for your account');

    // Decrypt sensitive fields and strip storage-only fields
    const safeMembers = family.members.map((m) => ({
        id: m.id,
        nameAsInAadhaar: m.nameAsInAadhaar,
        phoneAsInAadhaar: m.phoneAsInAadhaar,
        aadhaar: decrypt(m.aadhaarEncrypted),          // decrypted for owner
        pan: m.panEncrypted ? decrypt(m.panEncrypted) : null,
        incomeRange: m.incomeRange,
        occupation: m.occupation,
        age: m.age,
        gender: m.gender,
        religion: m.religion,
        physicallyDisabled: m.physicallyDisabled,
        isAadhaarVerified: m.isAadhaarVerified,
        isPanVerified: m.isPanVerified,
        createdAt: m.createdAt,
        // aadhaarHash, panHash, aadhaarEncrypted, panEncrypted — OMITTED
    }));

    return {
        id: family.id,
        temporaryFamilyId: family.temporaryFamilyId,
        status: family.status,
        state: family.state,
        category: family.category,
        createdAt: family.createdAt,
        memberCount: safeMembers.length,
        members: safeMembers,
    };
};
