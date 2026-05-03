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
        PENDING: { color: 'text-amber-800 bg-amber-50 border-amber-200', icon: <Clock className="h-3.5 w-3.5" />, label: 'Pending' },
        APPROVED: { color: 'text-emerald-800 bg-emerald-50 border-emerald-200', icon: <CheckCircle className="h-3.5 w-3.5" />, label: 'Approved' },
        REJECTED: { color: 'text-red-800 bg-red-50 border-red-200', icon: <XCircle className="h-3.5 w-3.5" />, label: 'Rejected' },
    };
    const cfg = map[status] ?? map['PENDING'];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1 text-[11px] font-black uppercase tracking-widest ${cfg.color}`}>
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
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-10">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b-2 border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border-2 border-blue-100 shadow-sm shadow-blue-50">
                            <FileText className="h-8 w-8 text-[var(--gov-blue)]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-[var(--gov-blue)] tracking-tight">Active Claims</h1>
                            <p className="mt-1 text-base font-bold text-slate-700">Tracking and managing your family's welfare applications</p>
                        </div>
                    </div>
                </div>
                <Link
                    href="/recommendations"
                    className="flex items-center gap-2 rounded-xl bg-[var(--gov-gold)] px-6 py-3.5 text-sm font-black text-[var(--gov-blue)] hover:brightness-110 transition-all shadow-xl shadow-amber-100"
                >
                    <Sparkles className="h-4 w-4" />
                    GET AI RECOMMENDATIONS
                </Link>
            </motion.div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center gap-5 py-24 text-[var(--gov-blue)]">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p className="font-black uppercase tracking-widest text-sm">Retrieving Claims History...</p>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-red-200 bg-red-50 py-16 text-center shadow-sm">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="text-base font-black text-red-700">{error}</p>
                </div>
            ) : claims.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center gap-6 py-20 text-center rounded-2xl border-2 border-slate-100 bg-white shadow-sm"
                >
                    <div className="rounded-full bg-slate-50 p-6 shadow-sm border border-slate-100">
                        <FileText className="h-10 w-10 text-slate-200 mx-auto" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-slate-900 mb-1">No Applications Found</p>
                        <p className="text-base font-bold text-slate-600">Start by discovering schemes tailored for your family.</p>
                    </div>
                    <Link
                        href="/recommendations"
                        className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--gov-blue)] px-8 py-4 text-sm font-black text-white hover:brightness-110 shadow-xl shadow-blue-100 transition-all"
                    >
                        <PlusCircle className="h-5 w-5" />
                        APPLY FOR SCHEMES
                    </Link>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Summary strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { label: 'Total Submitted', count: claims.length, color: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200' },
                            { label: 'Approved Claims', count: claims.filter(c => c.status === 'APPROVED').length, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                            { label: 'Under Review', count: claims.filter(c => c.status === 'PENDING').length, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-100' },
                        ].map(({ label, count, color, bg, border }) => (
                            <div key={label} className={`rounded-2xl ${border} ${bg} p-6 text-center shadow-sm border-2`}>
                                <p className={`text-5xl font-black ${color}`}>{count}</p>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mt-3">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Claims table */}
                    <div className="overflow-x-auto rounded-2xl border-2 border-slate-100 bg-white shadow-md relative">
                        <div className="absolute top-0 left-0 bg-[var(--gov-blue)] w-1.5 h-full" />
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-left">
                                    {['Member', 'Scheme ID', 'Family Ref', 'Source', 'Status', 'Date', 'Track'].map((h, i) => (
                                        <th key={h} className={`py-5 text-xs font-black uppercase tracking-widest text-slate-600 ${i === 0 ? 'pl-10 pr-6' : 'px-6'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {claims.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="pl-10 pr-6 py-6">
                                            <p className="font-black text-slate-900 text-base">{c.member.name}</p>
                                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">{c.member.occupation} · Age {c.member.age}</p>
                                        </td>
                                        <td className="px-6 py-6 font-mono text-xs font-black text-indigo-700 bg-indigo-50/30">{c.schemeId}</td>
                                        <td className="px-6 py-6">
                                            <span className="inline-block rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-bold text-slate-700 border border-slate-200">
                                                {c.family.temporaryFamilyId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-2 ${c.source === 'AI_RECOMMENDED'
                                                ? 'bg-blue-50 text-indigo-800 border-indigo-100'
                                                : 'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {c.source === 'AI_RECOMMENDED' ? '🤖 AI MATCH' : '✍️ MANUAL'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6"><StatusBadge status={c.status} /></td>
                                        <td className="px-6 py-6 text-slate-600 font-black text-xs uppercase">
                                            {new Date(c.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <Link
                                                href={`/claim/${c.id}`}
                                                className="group inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border-2 border-slate-200 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:border-[var(--gov-blue)] hover:text-[var(--gov-blue)] transition-all"
                                            >
                                                Details <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
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
