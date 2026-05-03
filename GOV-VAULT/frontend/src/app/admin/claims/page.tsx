'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { entitlementApi, adminApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Loader2, AlertCircle, ShieldCheck, CheckCircle,
    XCircle, User, Tag, MapPin, Briefcase, CreditCard,
    Sparkles, Heart, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

interface SchemeClaimFull {
    id: string;
    schemeId: string;
    source: 'AI_RECOMMENDED' | 'MANUAL';
    status: string;
    createdAt: string;
    member: {
        id: string;
        nameAsInAadhaar: string;
        age: number;
        occupation: string;
        incomeRange: string;
        gender: string;
        religion: string;
        physicallyDisabled: boolean;
    };
    family: {
        id: string;
        temporaryFamilyId: string;
        state: string;
        category: string;
        createdBy?: { email: string };
    };
}

interface PolicyClaim {
    id: string;
    memberId: string;
    claimantName: string;
    claimType: string;
    status: string;
    updatedAt: string;
    policy: {
        policyType: string;
        issuingAuthority: string;
    };
}

function SchemeClaimCard({ claim, onApprove, onReject }: {
    claim: SchemeClaimFull;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string) => Promise<void>;
}) {
    const [expanded, setExpanded] = useState(false);
    const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null);

    const handleApprove = async () => {
        setProcessing('approve');
        await onApprove(claim.id);
        setProcessing(null);
    };
    const handleReject = async () => {
        setProcessing('reject');
        await onReject(claim.id);
        setProcessing(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-indigo-100 bg-white shadow-sm overflow-hidden"
        >
            {/* Top bar */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-white" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                        {claim.source === 'AI_RECOMMENDED' ? 'AI Recommended Scheme' : 'Manual Scheme Claim'}
                    </span>
                </div>
                <span className="font-mono text-xs text-blue-200 font-bold">{claim.id.split('-')[0].toUpperCase()}</span>
            </div>

            <div className="p-6">
                {/* Scheme ID + Date */}
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Scheme ID</p>
                        <p className="font-mono text-base font-black text-indigo-700">{claim.schemeId}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Submitted On</p>
                        <p className="text-sm font-bold text-slate-700">
                            {new Date(claim.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Member summary */}
                <div className="rounded-xl bg-slate-50 border-2 border-slate-100 p-4 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Claimant</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <ProfileChip icon={<User className="h-3.5 w-3.5" />} label="Name" value={claim.member.nameAsInAadhaar} />
                        <ProfileChip icon={<Heart className="h-3.5 w-3.5" />} label="Age / Gender" value={`${claim.member.age}y · ${claim.member.gender}`} />
                        <ProfileChip icon={<Tag className="h-3.5 w-3.5" />} label="Religion" value={claim.member.religion || '—'} />
                        <ProfileChip icon={<MapPin className="h-3.5 w-3.5" />} label="State" value={claim.family.state || '—'} />
                        <ProfileChip icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Category" value={claim.family.category || '—'} />
                        <ProfileChip icon={<Briefcase className="h-3.5 w-3.5" />} label="Occupation" value={claim.member.occupation || '—'} />
                    </div>

                    <button onClick={() => setExpanded(v => !v)}
                        className="mt-4 flex items-center gap-1.5 text-[11px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors">
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {expanded ? 'Less Details' : 'More Details'}
                    </button>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden">
                                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <ProfileChip icon={<CreditCard className="h-3.5 w-3.5" />} label="Income Range" value={claim.member.incomeRange || '—'} />
                                    <ProfileChip icon={<Tag className="h-3.5 w-3.5" />} label="Family Ref" value={claim.family.temporaryFamilyId} mono />
                                    <ProfileChip icon={<User className="h-3.5 w-3.5" />} label="Disabled" value={claim.member.physicallyDisabled ? 'Yes' : 'No'} />
                                    {claim.family.createdBy?.email && (
                                        <ProfileChip icon={<User className="h-3.5 w-3.5" />} label="Account Email" value={claim.family.createdBy.email} />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={handleReject}
                        disabled={!!processing}
                        className="flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-5 py-2.5 text-sm font-black text-red-700 hover:bg-red-100 disabled:opacity-60 transition-all"
                    >
                        {processing === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Reject Claim
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={!!processing}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-100"
                    >
                        {processing === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Approve Claim
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function ProfileChip({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-start gap-2">
            <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className={`text-xs font-bold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
        </div>
    );
}

function AdminClaimsDashboard() {
    const [policyClaims, setPolicyClaims] = useState<PolicyClaim[]>([]);
    const [schemeClaims, setSchemeClaims] = useState<SchemeClaimFull[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllClaims = async () => {
            try {
                const [entRes, schRes] = await Promise.all([
                    entitlementApi.adminGetSubmitted().catch(() => ({ data: [] })),
                    adminApi.getPendingClaims().catch(() => ({ data: { claims: [] } }))
                ]);
                setPolicyClaims((entRes.data as PolicyClaim[]) || []);
                setSchemeClaims((schRes.data as { claims: SchemeClaimFull[] }).claims || []);
            } catch {
                setError('Failed to load claims queue.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllClaims();
    }, []);

    const handleApproveScheme = async (id: string) => {
        await adminApi.approveClaim(id);
        setSchemeClaims(prev => prev.filter(c => c.id !== id));
    };

    const handleRejectScheme = async (id: string) => {
        await adminApi.rejectClaim(id);
        setSchemeClaims(prev => prev.filter(c => c.id !== id));
    };

    if (loading) return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm font-bold text-slate-600">Loading Claims Queue...</p>
        </div>
    );

    if (error) return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-600">{error}</p>
            </div>
        </div>
    );

    const total = schemeClaims.length + policyClaims.length;

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border-2 border-indigo-100 shadow-sm">
                    <ShieldCheck className="h-7 w-7 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Scheme Approvals</h1>
                    <p className="text-sm font-bold text-slate-500 mt-0.5">{schemeClaims.length} welfare scheme claim{schemeClaims.length !== 1 ? 's' : ''} pending action</p>
                </div>
            </div>

            {total === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-16 text-center">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-black text-slate-800 mb-1">Queue Empty</h3>
                    <p className="text-sm font-bold text-slate-500">No claims are currently waiting for review.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Scheme Claims Section */}
                    {schemeClaims.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-5 w-5 text-indigo-500" />
                                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-700">
                                    AI-Recommended Welfare Scheme Claims ({schemeClaims.length})
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {schemeClaims.map(claim => (
                                    <SchemeClaimCard
                                        key={claim.id}
                                        claim={claim}
                                        onApprove={handleApproveScheme}
                                        onReject={handleRejectScheme}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Policy Claims Section */}
                    {policyClaims.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <h2 className="text-sm font-black uppercase tracking-widest text-blue-700">
                                    Policy Claims ({policyClaims.length})
                                </h2>
                            </div>
                            <div className="rounded-2xl border-2 border-blue-100 bg-white overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-blue-50 border-b-2 border-blue-100">
                                        <tr>
                                            {['Claim Ref', 'Claimant', 'Policy Type', 'Status', 'Last Updated', 'Action'].map(h => (
                                                <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-blue-700 text-left">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {policyClaims.map(claim => (
                                            <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-4 font-mono text-xs font-bold text-blue-700">{claim.id.split('-')[0].toUpperCase()}</td>
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-slate-900">{claim.claimantName}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{claim.claimType}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-slate-800">{claim.policy?.policyType || '—'}</p>
                                                    <p className="text-xs text-slate-400">{claim.policy?.issuingAuthority || '—'}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-black text-amber-800 uppercase tracking-wider">
                                                        <Clock className="h-3 w-3" /> {claim.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-bold text-slate-500">
                                                    {new Date(claim.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <a href={`/admin/claims/${claim.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gov-blue)] px-3 py-1.5 text-xs font-black text-white hover:brightness-110 transition-all">
                                                        Review
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AdminClaimsPage() {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminClaimsDashboard />
        </ProtectedRoute>
    );
}
