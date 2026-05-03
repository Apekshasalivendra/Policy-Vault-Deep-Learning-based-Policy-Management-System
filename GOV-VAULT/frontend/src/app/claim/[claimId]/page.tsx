'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import {
    FileText, CheckCircle, AlertCircle, Loader2, ArrowLeft,
    User, Clock, XCircle, Sparkles, Building2, Calendar, Tag,
    BadgeCheck, CreditCard, Users, MapPin, Heart
} from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { claimApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SchemeClaim {
    id: string;
    schemeId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    source: 'AI_RECOMMENDED' | 'MANUAL';
    createdAt: string;
    updatedAt: string;
    member: {
        id: string;
        nameAsInAadhaar: string;
        age: number;
        occupation: string;
        incomeRange: string;
        gender: string;
        religion: string;
    };
    family: {
        id: string;
        temporaryFamilyId: string;
        status: string;
        state: string;
        category: string;
    };
}

type PageState =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; claim: SchemeClaim };

// ── Status config ────────────────────────────────────────────────────────────
function getStatusConfig(status: string) {
    const map: Record<string, { icon: React.ReactNode; label: string; desc: string; bg: string; border: string; text: string; accent: string }> = {
        PENDING: {
            icon: <Clock className="h-10 w-10 text-amber-600" />,
            label: 'Under Admin Review',
            desc: 'Your scheme claim is being reviewed by an administrator. You will be notified once a decision is made.',
            bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', accent: 'bg-amber-500'
        },
        APPROVED: {
            icon: <CheckCircle className="h-10 w-10 text-emerald-600" />,
            label: 'Claim Approved',
            desc: 'Your scheme claim has been approved! The benefits and entitlements from this scheme will be processed for you.',
            bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', accent: 'bg-emerald-500'
        },
        REJECTED: {
            icon: <XCircle className="h-10 w-10 text-red-600" />,
            label: 'Claim Rejected',
            desc: 'Your scheme claim was reviewed and rejected by the administrator. You may contact the support desk for more information.',
            bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', accent: 'bg-red-500'
        },
    };
    return map[status] ?? map['PENDING'];
}

// ── Timeline Steps ────────────────────────────────────────────────────────────
function ClaimTimeline({ claim }: { claim: SchemeClaim }) {
    const steps = [
        { key: 'submitted', label: 'Claim Submitted', desc: 'Application received in system', done: true },
        { key: 'review', label: 'Admin Review', desc: 'Administrator is reviewing eligibility', done: claim.status !== 'PENDING' || false, active: claim.status === 'PENDING' },
        { key: 'decision', label: 'Decision', desc: claim.status === 'APPROVED' ? 'Claim approved ✓' : claim.status === 'REJECTED' ? 'Claim rejected ✗' : 'Awaiting admin decision', done: claim.status === 'APPROVED' || claim.status === 'REJECTED', rejected: claim.status === 'REJECTED' },
        { key: 'benefit', label: 'Benefit Disbursed', desc: 'Scheme benefits processed', done: claim.status === 'APPROVED' },
    ];

    return (
        <div className="rounded-xl border-2 border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--gov-blue)]" /> Claim Timeline
            </h3>
            <div className="relative pl-4 space-y-5">
                <div className="absolute left-[19px] top-3 bottom-8 w-[2px] bg-slate-200" />
                {steps.map((step) => (
                    <div key={step.key} className="relative flex items-start gap-4">
                        <div className="absolute -left-1.5 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white">
                            <div className={`h-3.5 w-3.5 rounded-full border-2 ${
                                step.rejected ? 'bg-red-500 border-red-500' :
                                step.done ? 'bg-emerald-500 border-emerald-500' :
                                step.active ? 'bg-white border-[var(--gov-blue)] ring-4 ring-blue-50' :
                                'bg-white border-slate-300'
                            }`} />
                        </div>
                        <div className={`flex-1 pl-6 ${!step.done && !step.active && !step.rejected ? 'opacity-40' : ''}`}>
                            <p className={`text-sm font-bold ${step.rejected ? 'text-red-700' : step.done ? 'text-slate-900' : step.active ? 'text-[var(--gov-blue)]' : 'text-slate-500'}`}>
                                {step.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Content ──────────────────────────────────────────────────────────────
function ClaimDetailsContent({ claimId }: { claimId: string }) {
    const [pageState, setPageState] = useState<PageState>({ kind: 'loading' });

    useEffect(() => {
        claimApi.getClaimById(claimId)
            .then((res) => {
                const claim = (res.data as { claim: SchemeClaim }).claim;
                setPageState({ kind: 'ready', claim });
            })
            .catch((err: any) => {
                const msg = err.response?.data?.error ?? 'Failed to load claim details.';
                setPageState({ kind: 'error', message: msg });
            });
    }, [claimId]);

    if (pageState.kind === 'loading') {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-[var(--gov-blue)]">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p className="font-bold tracking-wide text-sm">Fetching Claim Details...</p>
                </div>
            </div>
        );
    }

    if (pageState.kind === 'error') {
        return (
            <div className="mx-auto max-w-3xl px-4 py-12">
                <Link href="/claims" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--gov-blue)] transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Claims
                </Link>
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-red-200 bg-red-50 py-16 text-center shadow-sm">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <h2 className="text-xl font-bold text-red-700">Could Not Load Claim</h2>
                    <p className="text-sm font-medium text-red-600">{pageState.message}</p>
                </div>
            </div>
        );
    }

    const { claim } = pageState;
    const statusCfg = getStatusConfig(claim.status);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-b-2 border-slate-100 pb-6">
                <Link href="/claims" className="mb-4 flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[var(--gov-blue)] transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4" /> Back to Active Claims
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border-2 border-blue-100 shadow-sm">
                            <FileText className="h-7 w-7 text-[var(--gov-blue)]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Scheme Claim Details</h1>
                            <p className="font-mono text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Ref: {claim.id.split('-')[0].toUpperCase()}</p>
                        </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-black uppercase tracking-wider ${statusCfg.border} ${statusCfg.bg} ${statusCfg.text}`}>
                        {claim.status === 'PENDING' ? <Clock className="h-4 w-4" /> : claim.status === 'APPROVED' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {statusCfg.label}
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left — Status + Scheme */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Card */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border-2 p-7 ${statusCfg.border} ${statusCfg.bg} relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${statusCfg.accent}`} />
                        <div className="flex items-start gap-5 pl-3">
                            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 bg-white ${statusCfg.border} shadow-sm`}>
                                {statusCfg.icon}
                            </div>
                            <div>
                                <h2 className={`text-xl font-black mb-2 ${statusCfg.text}`}>{statusCfg.label}</h2>
                                <p className={`text-sm font-bold leading-relaxed ${statusCfg.text} opacity-80`}>{statusCfg.desc}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Scheme Details */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                        className="rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-5 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" /> Scheme Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <InfoRow icon={<Tag className="h-4 w-4 text-slate-400" />} label="Scheme ID" value={claim.schemeId} mono />
                            <InfoRow icon={<Building2 className="h-4 w-4 text-slate-400" />} label="Source" value={claim.source === 'AI_RECOMMENDED' ? '🤖 AI Recommended' : '✍️ Manual'} />
                            <InfoRow icon={<Calendar className="h-4 w-4 text-slate-400" />} label="Applied On" value={new Date(claim.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
                            <InfoRow icon={<Clock className="h-4 w-4 text-slate-400" />} label="Last Updated" value={new Date(claim.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
                        </div>
                    </motion.div>

                    {/* Member Profile */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                        className="rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-5 flex items-center gap-2">
                            <User className="h-4 w-4" /> Claimant Profile
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <InfoRow icon={<BadgeCheck className="h-4 w-4 text-slate-400" />} label="Full Name" value={claim.member.nameAsInAadhaar} />
                            <InfoRow icon={<Users className="h-4 w-4 text-slate-400" />} label="Age" value={`${claim.member.age} years`} />
                            <InfoRow icon={<Heart className="h-4 w-4 text-slate-400" />} label="Gender" value={claim.member.gender || '—'} />
                            <InfoRow icon={<Building2 className="h-4 w-4 text-slate-400" />} label="Occupation" value={claim.member.occupation || '—'} />
                            <InfoRow icon={<CreditCard className="h-4 w-4 text-slate-400" />} label="Income Range" value={claim.member.incomeRange || '—'} />
                            <InfoRow icon={<BadgeCheck className="h-4 w-4 text-slate-400" />} label="Religion" value={claim.member.religion || '—'} />
                        </div>
                    </motion.div>

                    {/* Family Info */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                        className="rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-5 flex items-center gap-2">
                            <Users className="h-4 w-4" /> Family Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <InfoRow icon={<Tag className="h-4 w-4 text-slate-400" />} label="Family ID" value={claim.family.temporaryFamilyId} mono />
                            <InfoRow icon={<MapPin className="h-4 w-4 text-slate-400" />} label="State" value={claim.family.state || '—'} />
                            <InfoRow icon={<BadgeCheck className="h-4 w-4 text-slate-400" />} label="Category" value={claim.family.category || '—'} />
                            <InfoRow icon={<CheckCircle className="h-4 w-4 text-slate-400" />} label="Family Status" value={claim.family.status} />
                        </div>
                    </motion.div>
                </div>

                {/* Right — Timeline */}
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }}>
                    <ClaimTimeline claim={claim} />

                    {/* Help box */}
                    <div className="mt-4 rounded-xl border-2 border-slate-100 bg-slate-50 p-5">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Need Help?</p>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                            If you have questions about this claim, contact the GOV-VAULT welfare helpdesk with your claim reference ID.
                        </p>
                        <p className="mt-3 font-mono text-xs font-bold text-[var(--gov-blue)] bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                            {claim.id}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// ── Utility ───────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                <p className={`text-sm font-bold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
        </div>
    );
}

// ── Page Export ───────────────────────────────────────────────────────────────
export default function DynamicClaimPage({ params }: { params: Promise<{ claimId: string }> }) {
    const resolvedParams = use(params);
    return (
        <ProtectedRoute requiredRole="USER">
            <ClaimDetailsContent claimId={resolvedParams.claimId} />
        </ProtectedRoute>
    );
}
