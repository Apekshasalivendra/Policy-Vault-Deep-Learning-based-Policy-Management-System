'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { entitlementApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, AlertCircle, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';

interface DeathReport {
    id: string;
    memberId: string;
    policyId: string;
    reportedByUserId: string;
    status: 'REPORTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
    notes: string | null;
    reportedAt: string;
    verifiedAt: string | null;
}

function AdminDeathReportsDashboard() {
    const [reports, setReports] = useState<DeathReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await entitlementApi.adminGetDeathReports();
            setReports(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load death reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleAction = async (id: string, action: 'verify' | 'reject') => {
        setActionLoadingId(id);
        try {
            if (action === 'verify') await entitlementApi.adminVerifyDeath(id);
            if (action === 'reject') await entitlementApi.adminRejectDeath(id);
            await fetchReports();
        } catch (err: any) {
            alert(err.response?.data?.error || `Failed to ${action} report.`);
        } finally {
            setActionLoadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-sm font-medium text-slate-600">Loading Death Reports...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-sm font-medium text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
                        <ShieldCheck className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Death Reports Administration</h1>
                        <p className="text-sm font-medium text-slate-600 mt-0.5">Verify survivor reporting and unlock entitlement claims.</p>
                    </div>
                </div>
            </motion.div>

            {reports.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center shadow-sm">
                    <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Queue Empty</h3>
                    <p className="text-sm font-medium text-slate-600">No death reports are currently awaiting administration.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Report ID</th>
                                    <th className="px-6 py-4">Member / Policy</th>
                                    <th className="px-6 py-4">Reported By</th>
                                    <th className="px-6 py-4">Date Reported</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reports.map((report) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={report.id}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-[var(--gov-blue)]">
                                            {report.id.split('-')[0]}...
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 font-mono tracking-tight text-xs">M: {report.memberId}</div>
                                            <div className="font-medium text-slate-500 font-mono tracking-tight text-xs mt-0.5">P: {report.policyId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 font-mono text-xs tracking-tight">{report.reportedByUserId}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                                            {new Date(report.reportedAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
                                                report.status === 'REPORTED' || report.status === 'UNDER_REVIEW' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                report.status === 'VERIFIED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                report.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                {report.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {report.status === 'REPORTED' || report.status === 'UNDER_REVIEW' ? (
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => handleAction(report.id, 'reject')}
                                                        disabled={actionLoadingId !== null}
                                                        className="inline-flex justify-center items-center gap-1.5 py-1.5 px-3 rounded-sm bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 text-xs font-bold text-red-600 transition-all disabled:opacity-50 shadow-sm"
                                                    >
                                                        {actionLoadingId === report.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(report.id, 'verify')}
                                                        disabled={actionLoadingId !== null}
                                                        className="inline-flex justify-center items-center gap-1.5 py-1.5 px-3 rounded-sm bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                                                    >
                                                        {actionLoadingId === report.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                                        Verify
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-400">—</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminDeathReportsPage() {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminDeathReportsDashboard />
        </ProtectedRoute>
    );
}
