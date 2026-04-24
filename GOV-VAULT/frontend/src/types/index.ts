// Shared TypeScript types across the frontend

export type Role = 'USER' | 'ADMIN';

export interface AuthUser {
    userId: string;
    email: string;
    role: Role;
}

export interface FamilyMember {
    id: string;
    name: string;
    phone: string;
    aadhaar?: string;   // decrypted — only present on /family/my
    pan?: string;
    incomeRange: string;
    occupation: string;
    age: number;
}

export interface Family {
    id: string;
    temporaryFamilyId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    memberCount: number;
    members: FamilyMember[];
    createdAt: string;
}

export interface Claim {
    id: string;
    schemeId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    source: 'AI_RECOMMENDED' | 'MANUAL';
    createdAt: string;
    member: { id: string; name: string; age: number; occupation: string };
    family: { id: string; temporaryFamilyId: string; status: string };
}

export interface SchemeRecommendation {
    schemeId: string;
    schemeName: string;
    benefitSummary: string;
    eligibilityReason: string;
    source: string;
    recommendedAt: string;
}

export interface RecommendationResponse {
    familyId: string;
    memberCount: number;
    count: number;
    schemes: SchemeRecommendation[];
}

export interface ApiError {
    error: string;
    message?: string;
}
