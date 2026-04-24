import { Request, Response } from 'express';
import { getAuditLogs } from '../services/auditLog.service';

// ── GET /admin/audit-logs ──────────────────────────────────────────────────────
// Returns last 100 audit log entries for admin transparency dashboard.
// No Aadhaar, PAN, or personal data exposed — only email + action + timestamp.
export const getAuditLogsHandler = async (_req: Request, res: Response): Promise<void> => {
    try {
        const logs = await getAuditLogs();
        res.json({ count: logs.length, logs });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load audit logs';
        console.error('[audit.controller] Error:', message);
        res.status(500).json({ error: message });
    }
};
