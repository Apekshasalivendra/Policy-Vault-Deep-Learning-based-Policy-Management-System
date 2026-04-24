// ── Types ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
    userId: string;
    role: 'USER' | 'ADMIN';
    iat?: number;
    exp?: number;
}
