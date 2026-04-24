/**
 * In-memory OTP store for mock Aadhaar verification.
 * ⚠️  Dev-only scaffolding — OTPs are NOT persisted across server restarts.
 *     The verification result is encoded in a signed JWT returned by confirmAadhaarVerification().
 */

interface OtpEntry {
    otp: string;
    expiresAt: number; // Unix timestamp ms
}

const store = new Map<string, OtpEntry>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function saveOtp(aadhaar: string, otp: string): void {
    store.set(aadhaar, { otp, expiresAt: Date.now() + OTP_TTL_MS });
}

export function validateOtp(aadhaar: string, otp: string): boolean {
    const entry = store.get(aadhaar);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
        store.delete(aadhaar);
        return false;
    }
    if (entry.otp !== otp) return false;
    store.delete(aadhaar); // single-use
    return true;
}

export function clearOtp(aadhaar: string): void {
    store.delete(aadhaar);
}
