import crypto from 'crypto';

/**
 * Returns a deterministic SHA-256 hex digest of the input string.
 * Used for Aadhaar and PAN duplicate detection — never for storage of raw values.
 */
export function hashValue(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex');
}
