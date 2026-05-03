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
    const [familyDocs, setFamilyDocs] = useState<Record<string, { id: string, fileName: string, filePath: string, uploadedAt: string }[]>>({});

    const toggleExpand = async (id: string) => {
        if (expandedFamilyId === id) {
            setExpandedFamilyId(null);
            return;
        }
        setExpandedFamilyId(id);
        
        // Fetch documents if we haven't already
        if (!familyDocs[id]) {
            try {
                const res = await adminApi.getFamilyDocuments(id);
                setFamilyDocs(prev => ({ ...prev, [id]: res.data.documents }));
            } catch (err) {
                console.error("Failed to load family documents", err);
            }
        }
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
                        className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border-2 px-6 py-4 text-sm font-black shadow-2xl backdrop-blur ${toast.kind === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-red-200 bg-red-50 text-red-800'
                            }`}
                    >
                        {toast.kind === 'success'
                            ? <CheckCircle className="h-6 w-6" />
                            : <AlertCircle className="h-6 w-6" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 border-b-2 border-slate-200 pb-8">
                <Link
                    href="/admin"
                    className="mb-5 flex w-fit items-center gap-2 text-sm font-black text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft className="h-4 w-4" /> Admin Dashboard
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border-2 border-amber-100 shadow-sm shadow-amber-50">
                            <Users className="h-8 w-8 text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Family Approval Queue</h1>
                            <p className="text-base font-bold text-slate-700 mt-1">Review and process pending family onboardings</p>
                        </div>
                    </div>
                    <button
                        onClick={loadFamilies}
                        className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RefreshCw className="h-4 w-4" /> REFRESH QUEUE
                    </button>
                </div>
            </motion.div>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center gap-5 py-24 text-indigo-600">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <span className="text-base font-black uppercase tracking-widest">Fetching Queue Data…</span>
                </div>
            ) : error ? (
                <div className="flex items-center gap-4 rounded-2xl border-2 border-red-100 bg-red-50 px-6 py-5 text-base font-bold text-red-700 shadow-sm">
                    <AlertCircle className="h-6 w-6 shrink-0" /> {error}
                </div>
            ) : families.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-5 py-24 text-center rounded-2xl border-2 border-slate-100 bg-white shadow-sm"
                >
                    <div className="rounded-full bg-slate-50 p-6 shadow-sm border border-slate-100">
                        <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-slate-900 mb-1">Approval Queue is Empty</p>
                        <p className="text-base font-bold text-slate-600">No families are currently awaiting verification.</p>
                    </div>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-md">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-left">
                                {['Family ID', 'Submitted By', 'Onboarding Status', 'Date', 'Operations'].map((h, i) => (
                                    <th key={h} className={`py-5 text-xs font-black uppercase tracking-widest text-slate-600 ${i === 0 ? 'pl-8 pr-5' : 'px-5'}`}>
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
                                            className="hover:bg-slate-50/80 transition-colors"
                                        >
                                            {/* Family ID */}
                                            <td className="pl-8 pr-5 py-6">
                                                <p className="font-mono text-base font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded w-fit mb-1.5">{f.temporaryFamilyId}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UUID: {f.id.slice(0, 12)}…</p>
                                            </td>

                                            {/* Email */}
                                            <td className="px-5 py-6 font-black text-slate-800">{f.createdBy.email}</td>

                                            {/* Member count */}
                                            <td className="px-5 py-6">
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border-2 border-slate-200 px-3 py-1.5 text-[11px] font-black uppercase text-slate-700">
                                                    <Users className="h-4 w-4" /> {f._count.members} Members
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-6">
                                                <p className="flex items-center gap-2 text-xs font-black text-slate-600">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    {new Date(f.createdAt).toLocaleDateString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                    })}
                                                </p>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-6">
                                                <div className="flex flex-col gap-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleAction(f.id, 'approving')}
                                                            disabled={!!action}
                                                            className="flex flex-1 justify-center items-center gap-2 rounded-xl bg-emerald-600 border-2 border-emerald-700 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-100 transition-all"
                                                        >
                                                            {isActing && action.type === 'approving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                            APPROVE
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(f.id, 'rejecting')}
                                                            disabled={!!action}
                                                            className="flex flex-1 justify-center items-center gap-2 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-2.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                                        >
                                                            {isActing && action.type === 'rejecting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                            REJECT
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleAction(f.id, 'requesting_docs')}
                                                            disabled={!!action}
                                                            className="flex flex-1 justify-center items-center gap-2 rounded-xl bg-indigo-50 border-2 border-indigo-200 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                                                        >
                                                            {isActing && action.type === 'requesting_docs' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                                                            DOCS REQ
                                                        </button>
                                                        <button
                                                            onClick={() => toggleExpand(f.id)}
                                                            className="flex flex-1 justify-center items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800 transition-all shadow-lg"
                                                        >
                                                            {expandedFamilyId === f.id ? 'HIDE' : 'VIEW DETAILS'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                        {expandedFamilyId === f.id && (
                                            <tr className="bg-slate-50/50 border-b-2 border-slate-100">
                                                <td colSpan={5} className="p-8">
                                                    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-inner">
                                                        <h3 className="text-sm font-black text-slate-900 mb-5 uppercase tracking-widest">Registered Family Members</h3>
                                                        <div className="grid gap-5 md:grid-cols-2">
                                                            {f.members?.map((m, idx) => (
                                                                <div key={m.id} className="rounded-xl border-2 border-slate-100 bg-slate-50/50 p-5">
                                                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                                                        <span className="text-base font-black text-slate-900">{m.nameAsInAadhaar}</span>
                                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 ${m.isAadhaarVerified ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                                                                            {m.isAadhaarVerified ? 'Verified' : 'Pending'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px] font-bold text-slate-700">
                                                                        <div><span className="text-slate-400 uppercase tracking-tighter block mb-0.5">Phone</span> {m.phoneAsInAadhaar}</div>
                                                                        <div><span className="text-slate-400 uppercase tracking-tighter block mb-0.5">Age</span> {m.age}</div>
                                                                        <div><span className="text-slate-400 uppercase tracking-tighter block mb-0.5">Gender</span> {m.gender}</div>
                                                                        <div><span className="text-slate-400 uppercase tracking-tighter block mb-0.5">Religion</span> {m.religion}</div>
                                                                        <div><span className="text-slate-400 uppercase tracking-tighter block mb-0.5">Disability</span> {m.physicallyDisabled ? 'YES' : 'NO'}</div>
                                                                        <div><span className="text-slate-400 uppercase tracking-tighter block mb-0.5">Occupation</span> {m.occupation}</div>
                                                                        <div className="col-span-2 mt-1 py-2 px-3 bg-white rounded border border-slate-100"><span className="text-slate-400 uppercase tracking-tighter block mb-0.5">Income Bracket</span> {m.incomeRange}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Documents Section */}
                                                        {familyDocs[f.id] && familyDocs[f.id].length > 0 && (
                                                            <div className="mt-8 border-t-2 border-slate-100 pt-6">
                                                                <h3 className="text-sm font-black text-slate-900 mb-5 uppercase tracking-widest flex items-center gap-2">
                                                                    Uploaded Verification Documents
                                                                </h3>
                                                                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                                                                    {familyDocs[f.id].map(doc => {
                                                                        const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${doc.filePath}`;
                                                                        return (
                                                                            <a 
                                                                                key={doc.id} 
                                                                                href={fileUrl} 
                                                                                target="_blank" 
                                                                                rel="noreferrer"
                                                                                className="group flex flex-col rounded-xl border-2 border-indigo-100 bg-indigo-50/30 p-4 transition-all hover:bg-indigo-50 hover:border-indigo-200"
                                                                            >
                                                                                <div className="mb-2 flex h-24 w-full items-center justify-center rounded-lg bg-slate-100 object-cover overflow-hidden">
                                                                                    {doc.fileName.toLowerCase().endsWith('.pdf') ? (
                                                                                        <span className="font-black text-slate-400 text-lg">PDF</span>
                                                                                    ) : (
                                                                                        <img src={fileUrl} alt={doc.fileName} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                                    )}
                                                                                </div>
                                                                                <p className="truncate text-xs font-bold text-indigo-900" title={doc.fileName}>{doc.fileName}</p>
                                                                                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                                                                </p>
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
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
                    <div className="border-t-2 border-slate-100 bg-slate-50/50 px-8 py-5 text-xs font-black text-slate-600 uppercase tracking-widest">
                        Total {families.length} pending onboarding request{families.length !== 1 ? 's' : ''}
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
