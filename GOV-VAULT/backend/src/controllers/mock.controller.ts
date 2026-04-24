import { Request, Response } from 'express';
import * as mockService from '../services/mock.service';

// ── POST /mock/verify-aadhaar ─────────────────────────────────────────────────
export const verifyAadhaar = (req: Request, res: Response): void => {
    try {
        const { aadhaar } = req.body as { aadhaar?: string };
        if (!aadhaar) {
            res.status(400).json({ error: 'aadhaar is required' });
            return;
        }
        const result = mockService.initiateAadhaarVerification(aadhaar);
        res.json(result);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Aadhaar verification failed';
        res.status(400).json({ error: message });
    }
};

// ── POST /mock/confirm-aadhaar ────────────────────────────────────────────────
export const confirmAadhaar = (req: Request, res: Response): void => {
    try {
        const { aadhaar, otp } = req.body as { aadhaar?: string; otp?: string };
        if (!aadhaar || !otp) {
            res.status(400).json({ error: 'aadhaar and otp are required' });
            return;
        }
        const result = mockService.confirmAadhaarVerification(aadhaar, otp);
        res.json(result);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'OTP confirmation failed';
        res.status(400).json({ error: message });
    }
};

// ── POST /mock/verify-pan ─────────────────────────────────────────────────────
export const verifyPan = (req: Request, res: Response): void => {
    try {
        const { pan } = req.body as { pan?: string };
        if (!pan) {
            res.status(400).json({ error: 'pan is required' });
            return;
        }
        const result = mockService.verifyPan(pan);
        res.json(result);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'PAN verification failed';
        res.status(400).json({ error: message });
    }
};
