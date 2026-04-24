import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { saveOtp, validateOtp } from '../utils/otpStore';

const AADHAAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// ── Aadhaar — Initiate ────────────────────────────────────────────────────────
export const initiateAadhaarVerification = (aadhaar: string) => {
    if (!AADHAAR_REGEX.test(aadhaar)) {
        throw new Error('Aadhaar must be exactly 12 digits');
    }

    const otp = crypto.randomInt(100_000, 999_999).toString();
    saveOtp(aadhaar, otp);

    return { message: 'OTP sent (dev mode — OTP returned in response)', otp };
};

// ── Aadhaar — Confirm ─────────────────────────────────────────────────────────
export const confirmAadhaarVerification = (aadhaar: string, otp: string) => {
    if (!AADHAAR_REGEX.test(aadhaar)) {
        throw new Error('Aadhaar must be exactly 12 digits');
    }

    const valid = validateOtp(aadhaar, otp);
    if (!valid) {
        throw new Error('Invalid or expired OTP');
    }

    // Issue a short-lived signed verification token (stateless proof of Aadhaar verification)
    const verificationToken = jwt.sign(
        { aadhaar, verified: true },
        process.env.JWT_SECRET as string,
        { expiresIn: '10m' }
    );

    return { verificationToken };
};

// ── PAN — Verify ──────────────────────────────────────────────────────────────
export const verifyPan = (pan: string) => {
    const verified = PAN_REGEX.test(pan);
    return { verified, message: verified ? 'PAN format valid' : 'Invalid PAN format' };
};
