'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, ArrowLeft, Loader2, AlertCircle, CheckCircle,
    XCircle, Clock, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminApi } from '@/lib/api';

interface PendingFamily {
    id: string;
    temporaryFamilyId: string;
    status: 'PENDING';
    createdAt: string;
    createdBy: { id: string; email: string };
    _count: { members: number };
    members: {
        id: string;
        nameAsInAadhaar: string;
        phoneAsInAadhaar: string;
        age: number;
        gender: string;
        religion: string;
        physicallyDisabled: boolean;
        occupation: string;
        incomeRange: string;
        isAadhaarVerified: boolean;
    }[];
}

type ActionState = { id: string; type: 'approving' | 'rejecting' | 'requesting_docs' } | null;
type Toast = { id: string; kind: 'success' | 'error'; message: string } | null;

function AdminFamiliesContent() {
    const [families, setFamilies] = useState<PendingFamily[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [action, setAction] = useState<ActionState>(null);
    const [toast, setToast] = useState<Toast>(null);
    const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedFamilyId((prev) => (prev === id ? null : id));
    };

    const showToast = (kind: 'success' | 'error', message: string) => {
        const id = Math.random().toString();
        setToast({ id, kind, message });
        setTimeout(() => setToast(null), 3500);
    };

    const loadFamilies = useCallback(() => {
        setLoading(true);
        adminApi.getPendingFamilies()
            .then((r) => {
                const data = r.data as { count: number; families: PendingFamily[] };
                setFamilies(data.families ?? []);
            })
            .catch(() => setError('Failed to load pending families.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadFamilies(); }, [loadFamilies]);

    const handleAction = async (familyId: string, type: 'approving' | 'rejecting' | 'requesting_docs') => {
        setAction({ id: familyId, type });
        try {
            if (type === 'approving') {
                await adminApi.approveFamily(familyId);
                showToast('success', 'Family approved successfully.');
                setFamilies((prev) => prev.filter((f) => f.id !== familyId));
            } else if (type === 'rejecting') {
                await adminApi.rejectFamily(familyId);
                showToast('success', 'Family rejected.');
                setFamilies((prev) => prev.filter((f) => f.id !== familyId));
            } else if (type === 'requesting_docs') {
                await adminApi.requestDocs(familyId);
                showToast('success', 'Document request email sent to the user.');
            }
        } catch (err) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            showToast('error', msg ?? 'Action failed. Please try again.');
        } finally {
            setAction(null);
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur ${toast.kind === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                            }`}
                    >
                        {toast.kind === 'success'
                            ? <CheckCircle className="h-5 w-5" />
                            : <AlertCircle className="h-5 w-5" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border-b border-slate-200 pb-6">
                <Link
                    href="/admin"
                    className="mb-4 flex w-fit items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Admin Dashboard
                </Link>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                            <Users className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Family Approval Queue</h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">Review and approve pending family registrations</p>
                        </div>
                    </div>
                    <button
                        onClick={loadFamilies}
                        className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                </div>
            </motion.div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-[var(--gov-blue)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-bold">Loading families…</span>
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 shadow-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" /> {error}
                </div>
            ) : families.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 py-20 text-center rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="rounded-full bg-slate-100 p-5 shadow-sm border border-slate-200">
                        <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900 mb-1">Queue is empty!</p>
                        <p className="text-sm font-medium text-slate-500">No families are currently awaiting approval.</p>
                    </div>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                {['Family ID', 'Submitted By', 'Members', 'Submitted On', 'Actions'].map((h, i) => (
                                    <th key={h} className={`py-4 text-xs font-bold uppercase tracking-wider text-slate-500 ${i === 0 ? 'pl-6 pr-4' : 'px-4'}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {families.map((f) => {
                                    const isActing = action?.id === f.id;
                                    return (
                                        <>
                                        <motion.tr
                                            key={f.id}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            {/* Family ID */}
                                            <td className="pl-6 pr-4 py-5">
                                                <p className="font-mono text-sm font-bold text-[var(--gov-blue)]">{f.temporaryFamilyId}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-1 font-mono">UUID: {f.id.slice(0, 8)}…</p>
                                            </td>

                                            {/* Email */}
                                            <td className="px-4 py-5 font-medium text-slate-700">{f.createdBy.email}</td>

                                            {/* Member count */}
                                            <td className="px-4 py-5">
                                                <span className="inline-flex items-center gap-1.5 rounded-sm bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-600">
                                                    <Users className="h-3 w-3" /> {f._count.members} Members
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-5">
                                                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(f.createdAt).toLocaleDateString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                    })}
                                                </p>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-5">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleAction(f.id, 'approving')}
                                                            disabled={!!action}
                                                            className="flex flex-1 justify-center items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                                        >
                                                            {isActing && action.type === 'approving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(f.id, 'rejecting')}
                                                            disabled={!!action}
                                                            className="flex flex-1 justify-center items-center gap-1.5 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                                        >
                                                            {isActing && action.type === 'rejecting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                            Reject
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleAction(f.id, 'requesting_docs')}
                                                            disabled={!!action}
                                                            className="flex flex-1 justify-center items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                                        >
                                                            {isActing && action.type === 'requesting_docs' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                                                            Request Docs
                                                        </button>
                                                        <button
                                                            onClick={() => toggleExpand(f.id)}
                                                            className="flex flex-1 justify-center items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
                                                        >
                                                            {expandedFamilyId === f.id ? 'Hide Details' : 'View Details'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                        {expandedFamilyId === f.id && (
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <td colSpan={5} className="p-6">
                                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                        <h3 className="text-sm font-bold text-slate-800 mb-4">Family Members</h3>
                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            {f.members?.map((m, idx) => (
                                                                <div key={m.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-sm font-bold text-slate-900">{m.nameAsInAadhaar}</span>
                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${m.isAadhaarVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                            {m.isAadhaarVerified ? 'Aadhaar Verified' : 'Aadhaar Pending'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-600 mt-3">
                                                                        <div><span className="text-slate-400">Phone:</span> {m.phoneAsInAadhaar}</div>
                                                                        <div><span className="text-slate-400">Age:</span> {m.age}</div>
                                                                        <div><span className="text-slate-400">Gender:</span> {m.gender}</div>
                                                                        <div><span className="text-slate-400">Religion:</span> {m.religion}</div>
                                                                        <div><span className="text-slate-400">Disabled:</span> {m.physicallyDisabled ? 'Yes' : 'No'}</div>
                                                                        <div><span className="text-slate-400">Occupation:</span> {m.occupation}</div>
                                                                        <div className="col-span-2"><span className="text-slate-400">Income:</span> {m.incomeRange}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs font-medium text-slate-500">
                        {families.length} family registration{families.length !== 1 ? 's' : ''} pending approval
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function AdminFamiliesPage() {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminFamiliesContent />
        </ProtectedRoute>
    );
}
