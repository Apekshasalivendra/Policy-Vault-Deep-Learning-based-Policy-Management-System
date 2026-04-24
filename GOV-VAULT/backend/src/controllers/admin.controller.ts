import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import { FamilyStatus } from '@prisma/client';

// ── GET /admin/families/pending ───────────────────────────────────────────────
export const getPendingFamilies = async (_req: Request, res: Response): Promise<void> => {
    try {
        const families = await adminService.listPendingFamilies();
        res.json({ count: families.length, families });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to list families';
        res.status(500).json({ error: message });
    }
};

// ── GET /admin/families ───────────────────────────────────────────────────────
export const getAllFamilies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.query as { status?: string };
        const validStatuses: FamilyStatus[] = [FamilyStatus.PENDING, FamilyStatus.APPROVED, FamilyStatus.REJECTED];
        const statusFilter = status && validStatuses.includes(status as FamilyStatus)
            ? (status as FamilyStatus)
            : undefined;
        const families = await adminService.listAllFamilies(statusFilter);
        res.json({ count: families.length, families });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to list families';
        res.status(500).json({ error: message });
    }
};

// ── POST /admin/family/:id/approve ────────────────────────────────────────────
export const approveFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.userId;
        const family = await adminService.approveFamily(adminId, id);
        res.json({ message: 'Family approved', family });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Approval failed';
        res.status(400).json({ error: message });
    }
};

// ── POST /admin/family/:id/reject ─────────────────────────────────────────────
export const rejectFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.userId;
        const family = await adminService.rejectFamily(adminId, id);
        res.json({ message: 'Family rejected', family });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Rejection failed';
        res.status(400).json({ error: message });
    }
};

// ── GET /admin/dashboard ──────────────────────────────────────────────────────
export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
    try {
        const metrics = await adminService.getDashboardMetrics();
        res.json(metrics);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        res.status(500).json({ error: message });
    }
};

// ── GET /admin/claims/pending ─────────────────────────────────────────────────
export const getPendingClaims = async (_req: Request, res: Response): Promise<void> => {
    try {
        const claims = await adminService.listPendingClaims();
        res.json({ count: claims.length, claims });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to list claims';
        res.status(500).json({ error: message });
    }
};

// ── POST /admin/claim/:id/approve ─────────────────────────────────────────────
export const approveClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.userId;
        const claim = await adminService.approveClaim(adminId, id);
        res.json({ message: 'Claim approved', claim });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Approval failed';
        res.status(400).json({ error: message });
    }
};

// ── POST /admin/claim/:id/reject ──────────────────────────────────────────────
export const rejectClaim = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.userId;
        const claim = await adminService.rejectClaim(adminId, id);
        res.json({ message: 'Claim rejected', claim });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Rejection failed';
        res.status(400).json({ error: message });
    }
};

