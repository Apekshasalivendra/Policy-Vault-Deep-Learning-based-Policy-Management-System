'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ScrollText, ArrowLeft, Loader2, AlertCircle,
    CheckCircle, XCircle, User, Clock,
} from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuditLog {
    id: string;
    userId: string;
    action: string;
    timestamp: string;
    user: { email: string };
}

// ── Action Badge ───────────────────────────────────────────────────────────────
function ActionBadge({ action }: { action: string }) {
    const isApprove = action.includes('APPROVED');
    const isReject = action.includes('REJECTED');
    const isLogin = action.toLowerCase().includes('login');

    if (isApprove) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle className="h-3 w-3" /> {action}
            </span>
        );
    }
    if (isReject) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700">
                <XCircle className="h-3 w-3" /> {action}
            </span>
        );
    }
    if (isLogin) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                <User className="h-3 w-3" /> {action}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {action}
        </span>
    );
}

// ── Page Content ───────────────────────────────────────────────────────────────
function AuditContent() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        adminApi.getAuditLogs()
            .then((r) => {
                const data = r.data as { count: number; logs: AuditLog[] };
                setLogs(data.logs ?? []);
            })
            .catch(() => setError('Failed to load audit logs.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border-b border-slate-200 pb-6">
                <Link
                    href="/admin"
                    className="mb-4 flex w-fit items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Admin Dashboard
                </Link>
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 shadow-sm">
                        <ScrollText className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Log</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Immutable record of every governance action — last 100 entries
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center gap-3 py-20 text-[var(--gov-blue)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-bold">Loading audit trail…</span>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 shadow-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" /> {error}
                </div>
            )}

            {/* Empty */}
            {!loading && !error && logs.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 py-20 text-center rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="rounded-full bg-slate-100 p-5 shadow-sm border border-slate-200">
                        <ScrollText className="h-8 w-8 text-slate-400 mx-auto" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900 mb-1">No audit logs yet</p>
                        <p className="text-sm font-medium text-slate-500">
                            Governance events will appear here as admins take actions.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Table */}
            {!loading && !error && logs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                <th className="pl-6 pr-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Admin</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log, i) => (
                                <motion.tr
                                    key={log.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    {/* Timestamp */}
                                    <td className="pl-6 pr-4 py-4 whitespace-nowrap">
                                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                            {new Date(log.timestamp).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', hour12: false,
                                            })}
                                        </p>
                                    </td>

                                    {/* User email */}
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                            {log.user.email}
                                        </span>
                                    </td>

                                    {/* Action badge */}
                                    <td className="px-4 py-4">
                                        <ActionBadge action={log.action} />
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs font-medium text-slate-500">
                        Showing {logs.length} most recent governance events
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function AdminAuditPage() {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AuditContent />
        </ProtectedRoute>
    );
}
