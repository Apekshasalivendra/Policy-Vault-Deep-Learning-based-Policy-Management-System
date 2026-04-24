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
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[var(--gov-blue)] hover:shadow-md transition-all"
        >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100">
                    <FileText className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 border border-indigo-200 ml-auto">
                    <Sparkles className="h-3 w-3" /> AI Recommended
                </span>
            </div>

            {/* Scheme Name */}
            <h3 className="mb-1.5 text-base font-semibold text-slate-900 leading-snug">
                {scheme.schemeName}
            </h3>

            {/* Scheme ID */}
            <p className="mb-4 font-mono text-[11px] text-slate-500 tracking-wide">
                {scheme.schemeId}
            </p>

            {/* Benefit */}
            <div className="mb-3">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Benefit</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{scheme.benefitSummary}</p>
            </div>

            {/* Eligibility */}
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    <CheckCircle className="h-3 w-3" /> Why you qualify
                </div>
                <p className="text-sm text-emerald-800 font-medium leading-relaxed">{scheme.eligibilityReason}</p>
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <Clock className="h-3 w-3" />
                    {new Date(scheme.recommendedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </p>
                <button
                    onClick={() => router.push(`/claim?schemeId=${encodeURIComponent(scheme.schemeId)}`)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-all shadow-sm shadow-indigo-500/10"
                >
                    Apply for this Scheme
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
            <div className="flex flex-col items-center justify-center gap-4 py-24">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="text-sm text-slate-500">
                    {state.kind === 'loading-family'
                        ? 'Checking family registration…'
                        : 'Generating personalized recommendations…'}
                </p>
            </div>
        );
    }

    // No family registered
    if (state.kind === 'no-family') {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <Users className="h-8 w-8 text-slate-400 mx-auto" />
                </div>
                <p className="text-base font-bold text-slate-900">No family registered</p>
                <p className="text-sm text-slate-600 max-w-xs font-medium">
                    Register your family first to access personalized scheme recommendations.
                </p>
                <Link
                    href="/apply"
                    className="rounded-xl bg-[var(--gov-blue)] px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all shadow-sm"
                >
                    Register Family
                </Link>
            </div>
        );
    }

    // Family not approved
    if (state.kind === 'not-approved') {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto" />
                </div>
                <p className="text-base font-bold text-slate-900">Family not yet approved</p>
                <p className="text-sm text-slate-600 max-w-sm font-medium">
                    Your family registration is currently{' '}
                    <span className={`font-bold ${state.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'}`}>
                        {state.status.toLowerCase()}
                    </span>
                    . Personalized recommendations are only available once an administrator approves your family.
                </p>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:border-[var(--gov-blue)] hover:text-[var(--gov-blue)] transition-all"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    // AI service unavailable
    if (state.kind === 'unavailable') {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                    <WifiOff className="h-8 w-8 text-red-500 mx-auto" />
                </div>
                <p className="text-base font-bold text-slate-900">Recommendation engine unavailable</p>
                <p className="text-sm text-slate-600 max-w-sm font-medium">{state.message}</p>
                <p className="text-xs font-bold text-slate-500">Please try again in a few minutes.</p>
            </div>
        );
    }

    // Error
    if (state.kind === 'error') {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                </div>
                <p className="text-base font-bold text-slate-900">Something went wrong</p>
                <p className="text-sm text-slate-600 max-w-xs font-medium">{state.message}</p>
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
                    className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm"
                >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Users className="h-4 w-4 text-[var(--gov-blue)]" />
                        Family ID:
                        <span className="font-mono text-[var(--gov-blue)] font-bold">{state.family.temporaryFamilyId}</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="text-sm font-medium text-slate-600">
                        {state.family.memberCount} member{state.family.memberCount !== 1 ? 's' : ''}
                    </div>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-3 w-3" /> Approved
                    </span>
                    <div className="ml-auto text-xs font-bold text-slate-500">
                        {state.schemes.length} scheme{state.schemes.length !== 1 ? 's' : ''} found
                    </div>
                </motion.div>

                {/* Schemes Grid */}
                {state.schemes.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <FileText className="h-7 w-7 text-slate-400 mx-auto" />
                        </div>
                        <p className="text-base font-bold text-[var(--gov-blue)]">No matching schemes found</p>
                        <p className="text-sm text-slate-600 max-w-xs font-medium">
                            Our AI could not find schemes matching your current profile. Check back as new schemes are added regularly.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                    className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors w-fit"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
                        <Sparkles className="h-6 w-6 text-[var(--gov-blue)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-[var(--gov-blue)]">Personalized Policy Recommendations</h1>
                        <p className="text-sm font-medium text-slate-600 mt-0.5">
                            AI-curated government welfare schemes matched to your family profile
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
