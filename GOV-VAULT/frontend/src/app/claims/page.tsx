'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FileText, CheckCircle, Clock, XCircle, Sparkles, PlusCircle, AlertCircle, Loader2, ChevronRight
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { claimApi } from '@/lib/api';

interface Claim {
    id: string;
    schemeId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    source: 'AI_RECOMMENDED' | 'MANUAL';
    createdAt: string;
    member: { id: string; name: string; age: number; occupation: string };
    family: { id: string; temporaryFamilyId: string; status: string };
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        PENDING: { color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
        APPROVED: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Approved' },
        REJECTED: { color: 'text-red-700 bg-red-50 border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
    };
    const cfg = map[status] ?? map['PENDING'];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.color}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

function ClaimsContent() {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        claimApi.getMyClaims()
            .then((r) => {
                const payload = r.data as { count: number; claims: Claim[] };
                setClaims(payload.claims ?? []);
            })
            .catch(() => setError('Could not load claims. Please try again.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 shadow-sm">
                            <FileText className="h-6 w-6 text-[var(--gov-blue)]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-[var(--gov-blue)] tracking-tight">Active Claims</h1>
                            <p className="mt-1 text-sm font-medium text-slate-500">All welfare scheme claims submitted by your family</p>
                        </div>
                    </div>
                </div>
                <Link
                    href="/recommendations"
                    className="flex items-center gap-2 rounded-sm bg-[var(--gov-gold)] px-5 py-2.5 text-sm font-bold text-[var(--gov-blue)] hover:brightness-110 transition-all shadow-sm"
                >
                    <Sparkles className="h-4 w-4" />
                    Get Recommendations
                </Link>
            </motion.div>

            {/* Content */}
            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-[var(--gov-blue)]">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <p className="font-semibold tracking-wide">Loading Applications...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center gap-4 rounded-xl border border-dashed border-red-200 bg-red-50 py-12 text-center shadow-sm">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
            ) : claims.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="rounded-full bg-slate-100 p-5 shadow-sm border border-slate-200">
                        <FileText className="h-8 w-8 text-slate-400 mx-auto" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-900 mb-1">No applications yet</p>
                        <p className="text-sm font-medium text-slate-500">Get AI-powered scheme recommendations to initiate a claim.</p>
                    </div>
                    <Link
                        href="/recommendations"
                        className="mt-2 flex items-center gap-2 rounded-sm bg-[var(--gov-blue)] px-6 py-3 text-sm font-bold text-white hover:brightness-110 shadow-sm transition-all"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Apply for Schemes
                    </Link>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Summary strip */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total Submitted', count: claims.length, color: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200' },
                            { label: 'Approved', count: claims.filter(c => c.status === 'APPROVED').length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                            { label: 'Pending Processing', count: claims.filter(c => c.status === 'PENDING').length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
                        ].map(({ label, count, color, bg, border }) => (
                            <div key={label} className={`rounded-lg ${border} ${bg} p-6 text-center shadow-sm border`}>
                                <p className={`text-4xl font-black ${color}`}>{count}</p>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Claims table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm relative">
                        <div className="absolute top-0 left-0 bg-[var(--gov-blue)] w-1 h-full" />
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                    {['Member', 'Scheme ID', 'Family Ref', 'Source', 'Status', 'Date', 'Timeline'].map((h, i) => (
                                        <th key={h} className={`py-4 text-xs font-bold uppercase tracking-wider text-slate-500 ${i === 0 ? 'pl-8 pr-5' : 'px-5'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {claims.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="pl-8 pr-5 py-5">
                                            <p className="font-bold text-slate-900">{c.member.name}</p>
                                            <p className="text-xs font-medium text-slate-500 mt-0.5">{c.member.occupation} · Age {c.member.age}</p>
                                        </td>
                                        <td className="px-5 py-5 font-mono text-xs font-medium text-slate-500">{c.schemeId}</td>
                                        <td className="px-5 py-5">
                                            <span className="inline-block rounded-sm bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-slate-600 border border-slate-200">
                                                {c.family.temporaryFamilyId}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5">
                                            <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${c.source === 'AI_RECOMMENDED'
                                                ? 'bg-blue-50 text-[var(--gov-blue)] border-blue-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                {c.source === 'AI_RECOMMENDED' ? '🤖 AI' : '✍️ Manual'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5"><StatusBadge status={c.status} /></td>
                                        <td className="px-5 py-5 text-slate-500 font-medium text-xs">
                                            {new Date(c.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-5 py-5 text-right">
                                            <Link
                                                href={`/claim/${c.id}`}
                                                className="inline-flex items-center text-xs font-bold text-[var(--gov-blue)] hover:underline"
                                            >
                                                Track Progress <ChevronRight className="h-3 w-3 ml-0.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function ClaimsPage() {
    return (
        <ProtectedRoute requiredRole="USER">
            <ClaimsContent />
        </ProtectedRoute>
    );
}
