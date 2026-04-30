import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as emailService from '../services/email.service';
import jwt from 'jsonwebtoken';

// ── POST /auth/send-verification-email ────────────────────────────────────────
export const sendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        // Check if user already exists
        const existingUser = await authService.getUserByEmail(email);
        if (existingUser) {
            res.status(400).json({ error: 'Email is already registered' });
            return;
        }

        await emailService.sendOtpEmail(email);
        res.json({ message: 'OTP sent successfully to ' + email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send verification email' });
    }
};

// ── POST /auth/verify-email ───────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ error: 'Email and OTP are required' });
            return;
        }

        const isValid = emailService.verifyOtp(email, otp);
        if (!isValid) {
            res.status(400).json({ error: 'Invalid or expired OTP' });
            return;
        }

        // Generate a temporary token to prove email verification during registration
        const verificationToken = jwt.sign(
            { email, verified: true },
            process.env.JWT_SECRET as string,
            { expiresIn: '15m' }
        );

        res.json({ message: 'Email verified successfully', verificationToken });
    } catch (err) {
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
};

// ── POST /auth/register ───────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, verificationToken } = req.body;

        if (!email || !password || !verificationToken) {
            res.status(400).json({ error: 'email, password, and verificationToken are required' });
            return;
        }

        // Verify the email verification token
        try {
            const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET as string) as { email: string, verified: boolean };
            if (decoded.email !== email || !decoded.verified) {
                throw new Error('Invalid token');
            }
        } catch (e) {
            res.status(401).json({ error: 'Invalid or expired verification token. Please verify your email again.' });
            return;
        }

        const user = await authService.registerUser(email, password);
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        res.status(400).json({ error: message });
    }
};

// ── POST /auth/login ──────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'email and password are required' });
            return;
        }

        const result = await authService.loginUser(email, password);
        res.json(result);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        res.status(401).json({ error: message });
    }
};

// ── GET /auth/me ──────────────────────────────────────────────────────────────
export const me = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await authService.getMe(req.user.userId);
        res.json({ user });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch profile';
        res.status(500).json({ error: message });
    }
};
