import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

// ── POST /auth/register ───────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Password strength enforcement on backend
        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }
        if (!/[A-Z]/.test(password)) {
            res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
            return;
        }
        if (!/[0-9]/.test(password)) {
            res.status(400).json({ error: 'Password must contain at least one number' });
            return;
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            res.status(400).json({ error: 'Password must contain at least one special character' });
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
            res.status(400).json({ error: 'Email and password are required' });
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
