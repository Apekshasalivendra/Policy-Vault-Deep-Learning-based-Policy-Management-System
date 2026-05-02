'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Loader2, AlertCircle, ArrowLeft, CheckCircle,
    FileText, Users, Clock, ChevronRight, WifiOff, ShieldAlert,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { familyApi, recommendationApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FamilySummary {
    temporaryFamilyId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    memberCount: number;
}

interface SchemeRecommendation {
    schemeId: string;
    schemeName: string;
    benefitSummary: string;
    eligibilityReason: string;
    source: string;
    recommendedAt: string;
}

type PageState =
    | { kind: 'loading-family' }
    | { kind: 'not-approved'; status: string }
    | { kind: 'no-family' }
    | { kind: 'loading-recs' }
    | { kind: 'unavailable'; message: string }
    | { kind: 'success'; schemes: SchemeRecommendation[]; family: FamilySummary }
    | { kind: 'error'; message: string };

// ── Scheme Card ────────────────────────────────────────────────────────────────
function SchemeCard({
    scheme, index,
}: {
    scheme: SchemeRecommendation; index: number;
}) {
    const router = useRouter();

    return (
        <motion.div
            key={scheme.schemeId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="flex flex-col rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm hover:border-[var(--gov-blue)] hover:shadow-md transition-all"
        >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                    <FileText className="h-5 w-5 text-[var(--gov-blue)]" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black text-indigo-800 border border-indigo-200 ml-auto uppercase tracking-tighter">
                    <Sparkles className="h-3 w-3" /> AI Recommended
                </span>
            </div>

            {/* Scheme Name */}
            <h3 className="mb-1.5 text-lg font-black text-slate-900 leading-tight">
                {scheme.schemeName}
            </h3>

            {/* Scheme ID */}
            <p className="mb-4 font-mono text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                ID: {scheme.schemeId}
            </p>

            {/* Benefit */}
            <div className="mb-4">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Benefit</p>
                <p className="text-sm text-slate-800 font-bold leading-relaxed">{scheme.benefitSummary}</p>
            </div>

            {/* Eligibility */}
            <div className="mb-6 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 px-4 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5" /> Eligibility Match
                </div>
                <p className="text-sm text-emerald-900 font-bold leading-relaxed">{scheme.eligibilityReason}</p>
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(scheme.recommendedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </p>
                <button
                    onClick={() => router.push(`/claim?schemeId=${encodeURIComponent(scheme.schemeId)}`)}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--gov-blue)] px-5 py-2.5 text-xs font-black text-white hover:brightness-110 transition-all shadow-lg shadow-blue-100"
                >
                    APPLY NOW
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

// ── State Renders ──────────────────────────────────────────────────────────────
function StateView({ state }: { state: PageState }) {
    // Loading family
    if (state.kind === 'loading-family' || state.kind === 'loading-recs') {
        return (
            <div className="flex flex-col items-center justify-center gap-5 py-24">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-sm font-black text-slate-600 uppercase tracking-widest">
                    {state.kind === 'loading-family'
                        ? 'Checking family registration…'
                        : 'AI is matching schemes to your profile…'}
                </p>
            </div>
        );
    }

    // No family registered
    if (state.kind === 'no-family') {
        return (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
                <div className="rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm">
                    <Users className="h-10 w-10 text-slate-300 mx-auto" />
                </div>
                <p className="text-xl font-black text-slate-900">No family registered</p>
                <p className="text-base text-slate-600 max-w-xs font-bold">
                    Register your family first to access personalized scheme recommendations.
                </p>
                <Link
                    href="/apply"
                    className="mt-2 rounded-xl bg-[var(--gov-blue)] px-7 py-3.5 text-base font-black text-white hover:brightness-110 transition-all shadow-xl shadow-blue-100"
                >
                    Register Family Now
                </Link>
            </div>
        );
    }

    // Family not approved
    if (state.kind === 'not-approved') {
        return (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
                <div className="rounded-2xl border-2 border-amber-100 bg-amber-50 p-6 shadow-sm">
                    <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto" />
                </div>
                <p className="text-xl font-black text-slate-900">Family not yet approved</p>
                <p className="text-base text-slate-700 max-w-sm font-bold">
                    Your family registration is currently{' '}
                    <span className={`font-black uppercase px-2 py-0.5 rounded ${state.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {state.status}
                    </span>
                    . Personalized recommendations are only available once an administrator approves your family.
                </p>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm hover:border-[var(--gov-blue)] hover:text-[var(--gov-blue)] transition-all"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    // AI service unavailable
    if (state.kind === 'unavailable') {
        return (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
                <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-6 shadow-sm">
                    <WifiOff className="h-10 w-10 text-red-500 mx-auto" />
                </div>
                <p className="text-xl font-black text-slate-900">Recommendation engine unavailable</p>
                <p className="text-base text-slate-700 max-w-sm font-bold">{state.message}</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Please try again in a few minutes.</p>
            </div>
        );
    }

    // Error
    if (state.kind === 'error') {
        return (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
                <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-6 shadow-sm">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                </div>
                <p className="text-xl font-black text-slate-900">Something went wrong</p>
                <p className="text-base text-slate-700 max-w-xs font-bold">{state.message}</p>
            </div>
        );
    }

    // Success
    if (state.kind === 'success') {
        return (
            <>
                {/* Family Summary Bar */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex flex-wrap items-center gap-5 rounded-2xl border-2 border-slate-100 bg-white px-6 py-4 shadow-sm"
                >
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                        <Users className="h-5 w-5 text-indigo-600" />
                        FAMILY ID:
                        <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded tracking-tighter">{state.family.temporaryFamilyId}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                    <div className="text-sm font-black text-slate-700">
                        {state.family.memberCount} REGISTERED MEMBER{state.family.memberCount !== 1 ? 'S' : ''}
                    </div>
                    <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200">
                        <CheckCircle className="h-3.5 w-3.5" /> ACCOUNT APPROVED
                    </span>
                    <div className="ml-auto text-xs font-black text-slate-500 uppercase tracking-widest">
                        {state.schemes.length} Result{state.schemes.length !== 1 ? 's' : ''}
                    </div>
                </motion.div>

                {/* Schemes Grid */}
                {state.schemes.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-20 text-center">
                        <div className="rounded-2xl border-2 border-slate-100 bg-white p-7 shadow-sm">
                            <FileText className="h-10 w-10 text-slate-200 mx-auto" />
                        </div>
                        <p className="text-xl font-black text-[var(--gov-blue)]">No matching schemes found</p>
                        <p className="text-base text-slate-600 max-w-sm font-bold">
                            Our AI could not find schemes matching your current profile. Check back as new schemes are added regularly.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence>
                            {state.schemes.map((scheme, i) => (
                                <SchemeCard key={scheme.schemeId} scheme={scheme} index={i} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </>
        );
    }

    return null;
}

// ── Main Page Content ──────────────────────────────────────────────────────────
function RecommendationsContent() {
    const [pageState, setPageState] = useState<PageState>({ kind: 'loading-family' });

    useEffect(() => {
        // Step 1: fetch family to check APPROVED status
        familyApi
            .getMyFamily()
            .then(async (r) => {
                const payload = r.data as { family: FamilySummary & { status: 'PENDING' | 'APPROVED' | 'REJECTED' } };
                const family = payload.family;

                if (!family) {
                    setPageState({ kind: 'no-family' });
                    return;
                }

                // Gate: block recommendations if not APPROVED
                if (family.status !== 'APPROVED') {
                    setPageState({ kind: 'not-approved', status: family.status });
                    return;
                }

                // Step 2: fetch recommendations
                setPageState({ kind: 'loading-recs' });
                try {
                    const recRes = await recommendationApi.get();
                    const data = recRes.data as {
                        schemes: SchemeRecommendation[];
                        unavailable?: boolean;
                        message?: string;
                        familyId?: string;
                        memberCount?: number;
                    };

                    if (data.unavailable) {
                        setPageState({
                            kind: 'unavailable',
                            message: data.message ?? 'Recommendation engine temporarily unavailable.',
                        });
                        return;
                    }

                    setPageState({
                        kind: 'success',
                        schemes: data.schemes ?? [],
                        family: {
                            temporaryFamilyId: family.temporaryFamilyId,
                            status: family.status,
                            memberCount: family.memberCount,
                        },
                    });
                } catch {
                    setPageState({
                        kind: 'error',
                        message: 'Failed to fetch recommendations. Please try again.',
                    });
                }
            })
            .catch((err) => {
                const msg =
                    (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                if (msg?.includes('No family')) {
                    setPageState({ kind: 'no-family' });
                } else {
                    setPageState({ kind: 'error', message: msg ?? 'Could not load family data.' });
                }
            });
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <Link
                    href="/dashboard"
                    className="mb-5 flex items-center gap-2 text-sm font-black text-slate-500 hover:text-indigo-600 transition-colors w-fit uppercase tracking-widest"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border-2 border-blue-100 shadow-sm shadow-blue-100">
                        <Sparkles className="h-8 w-8 text-[var(--gov-blue)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--gov-blue)] tracking-tight">Scheme Saathi AI</h1>
                        <p className="text-base font-bold text-slate-700 mt-0.5">
                            Personalized Welfare Matching Engine
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* State Panel */}
            <StateView state={pageState} />
        </div>
    );
}

export default function RecommendationsPage() {
    return (
        <ProtectedRoute requiredRole="USER">
            <RecommendationsContent />
        </ProtectedRoute>
    );
}
