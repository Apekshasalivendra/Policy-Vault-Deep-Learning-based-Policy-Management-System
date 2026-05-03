'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Users, CheckCircle, AlertCircle, Loader2,
    ArrowLeft, ChevronDown, Send, ShieldAlert, Clock,
} from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { familyApi, claimApi } from '@/lib/api';

declare global {
    interface Window {
        Razorpay: any;
    }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FamilyMember {
    id: string;
    nameAsInAadhaar: string;
    age: number;
    occupation: string;
    incomeRange: string;
}

interface Family {
    id: string;
    temporaryFamilyId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    memberCount: number;
    members: FamilyMember[];
}

type PageState =
    | { kind: 'loading' }
    | { kind: 'no-scheme' }
    | { kind: 'no-family' }
    | { kind: 'not-approved'; status: string }
    | { kind: 'ready'; family: Family }
    | { kind: 'error'; message: string };

type SubmitState =
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'success'; claimId?: string }
    | { kind: 'error'; code: 409 | 403 | 'other'; message: string };

// ── Claim Form Content ─────────────────────────────────────────────────────────
function ClaimContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const schemeId = searchParams.get('schemeId') ?? '';

    const [pageState, setPageState] = useState<PageState>({ kind: 'loading' });
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
    const [verificationMethod, setVerificationMethod] = useState<'RAZORPAY' | 'MANUAL'>('RAZORPAY');

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Auto-redirect removed because we redirect manually to the dynamic route
    useEffect(() => {
    }, [submitState, router]);

    useEffect(() => {
        if (!schemeId) {
            setPageState({ kind: 'no-scheme' });
            return;
        }

        familyApi
            .getMyFamily()
            .then((r) => {
                const payload = r.data as { family: Family };
                const family = payload.family;

                if (!family) {
                    setPageState({ kind: 'no-family' });
                    return;
                }

                if (family.status !== 'APPROVED') {
                    setPageState({ kind: 'not-approved', status: family.status });
                    return;
                }

                setPageState({ kind: 'ready', family });
                if (family.members.length === 1) {
                    setSelectedMemberId(family.members[0].id);
                }
            })
            .catch((err) => {
                const msg = (err as { response?: { data?: { error?: string } } })
                    ?.response?.data?.error;
                if (msg?.includes('No family') || err.response?.status === 404) {
                    setPageState({ kind: 'no-family' });
                } else {
                    setPageState({ kind: 'error', message: msg ?? 'Failed to load family data.' });
                }
            });
    }, [schemeId]);

    const handleSubmit = async () => {
        if (!selectedMemberId || pageState.kind !== 'ready') return;
        setSubmitState({ kind: 'submitting' });

        try {
            if (verificationMethod === 'RAZORPAY') {
                const sdkLoaded = await loadRazorpay();
                if (!sdkLoaded) {
                    setSubmitState({ kind: 'error', code: 'other', message: 'Failed to load Razorpay SDK' });
                    return;
                }

                // Call initiate API
                const res = await claimApi.initiateClaim(selectedMemberId, schemeId);
                const claimId = res.data.id;

                const options = {
                    key: 'rzp_test_ScHtzspSTvvi1X',
                    amount: '100', // 1 INR in paise
                    currency: 'INR',
                    name: 'GOV-VAULT KYC',
                    description: 'Penny Drop Bank Verification',
                    handler: function (response: any) {
                        setSubmitState({ kind: 'success', claimId });
                        setTimeout(() => router.push('/dashboard'), 3000);
                    },
                    modal: {
                        ondismiss: function() {
                            setSubmitState({ kind: 'idle' });
                        }
                    },
                    prefill: {
                        name: 'Claimant',
                        email: 'user@govvault.in'
                    },
                    theme: { color: '#2563eb' }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                // Manual fallback
                const res = await claimApi.initiateClaim(selectedMemberId, schemeId);
                setSubmitState({ kind: 'success', claimId: res.data.id });
                setTimeout(() => router.push('/dashboard'), 3000);
            }
        } catch (err) {
            const error = err as { response?: { status?: number; data?: { error?: string } } };
            const status = error.response?.status;
            const message = error.response?.data?.error ?? 'Something went wrong. Please try again.';

            if (status === 409) {
                setSubmitState({ kind: 'error', code: 409, message });
            } else if (status === 403) {
                setSubmitState({ kind: 'error', code: 403, message });
            } else {
                setSubmitState({ kind: 'error', code: 'other', message });
            }
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
            {/* Back Link */}
            <Link
                href="/recommendations"
                className="mb-6 flex w-fit items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Recommendations
            </Link>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-center gap-3"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
                    <FileText className="h-6 w-6 text-[var(--gov-blue)]" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[var(--gov-blue)]">Apply for Scheme</h1>
                    <p className="text-sm font-medium text-slate-600 mt-0.5">Submit a welfare scheme claim on behalf of a family member</p>
                </div>
            </motion.div>

            {/* Scheme ID Banner */}
            {schemeId && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3 flex items-center gap-3 shadow-sm"
                >
                    <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Scheme</p>
                        <p className="font-mono text-sm text-[var(--gov-blue)] font-bold">{schemeId}</p>
                    </div>
                </motion.div>
            )}

            {/* State Panels */}
            <AnimatePresence mode="wait">
                {/* Loading */}
                {pageState.kind === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-4 py-20"
                    >
                        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                        <p className="text-sm text-slate-500">Loading family data…</p>
                    </motion.div>
                )}

                {/* Missing schemeId */}
                {pageState.kind === 'no-scheme' && (
                    <motion.div
                        key="no-scheme"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm"
                    >
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                        <p className="text-base font-bold text-slate-900 mb-1">No scheme selected</p>
                        <p className="text-sm text-slate-600 font-medium mb-5">
                            This page requires a valid scheme ID. Please select a scheme from the recommendations page.
                        </p>
                        <Link
                            href="/recommendations"
                            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gov-blue)] px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all shadow-sm"
                        >
                            View Recommendations
                        </Link>
                    </motion.div>
                )}

                {/* No family */}
                {pageState.kind === 'no-family' && (
                    <motion.div
                        key="no-family"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
                    >
                        <Users className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                        <p className="text-base font-bold text-slate-900 mb-1">No family registered</p>
                        <p className="text-sm font-medium text-slate-600 mb-5">Please register your family before applying for schemes.</p>
                        <Link
                            href="/apply"
                            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gov-blue)] px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all shadow-sm"
                        >
                            Register Family
                        </Link>
                    </motion.div>
                )}

                {/* Not approved */}
                {pageState.kind === 'not-approved' && (
                    <motion.div
                        key="not-approved"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm"
                    >
                        <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                        <p className="text-base font-bold text-slate-900 mb-1">Family approval required</p>
                        <p className="text-sm font-medium text-slate-600 mb-5">
                            Your family is currently{' '}
                            <span className={pageState.status === 'REJECTED' ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>
                                {pageState.status.toLowerCase()}
                            </span>
                            . Claims can only be submitted for approved families.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-2.5 text-sm font-bold text-slate-600 hover:border-[var(--gov-blue)] hover:text-[var(--gov-blue)] transition-all"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                        </Link>
                    </motion.div>
                )}

                {/* Error loading */}
                {pageState.kind === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm"
                    >
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                        <p className="text-base font-bold text-slate-900 mb-1">Error</p>
                        <p className="text-sm font-medium text-slate-600">{pageState.message}</p>
                    </motion.div>
                )}

                {/* Ready — claim form */}
                {pageState.kind === 'ready' && (
                    <motion.div
                        key="ready"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-5"
                    >
                        {/* Success overlay */}
                        {submitState.kind === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm"
                            >
                                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                                <p className="text-xl font-black text-slate-900 mb-1">Claim submitted successfully!</p>
                                <p className="text-sm text-slate-600 font-medium mb-4">
                                    Your claim for <span className="font-mono font-bold text-[var(--gov-blue)]">{schemeId}</span> has been recorded and is pending review.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    Redirecting to dashboard in 3 seconds…
                                </div>
                            </motion.div>
                        )}

                        {/* Form (hidden on success) */}
                        {submitState.kind !== 'success' && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
                                {/* Family info */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-wide">Family</span>
                                    <span className="font-mono font-bold text-[var(--gov-blue)] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm">{pageState.family.temporaryFamilyId}</span>
                                </div>

                                <div className="h-px bg-slate-100" />

                                {/* Member selector */}
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        <span className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-slate-400" />
                                            Select Family Member
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedMemberId}
                                            onChange={(e) => {
                                                setSelectedMemberId(e.target.value);
                                                setSubmitState({ kind: 'idle' });
                                            }}
                                            className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-900 focus:border-[var(--gov-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--gov-blue)] transition-all shadow-sm cursor-pointer"
                                        >
                                            <option value="" className="bg-white text-slate-400 font-medium">— Choose a member —</option>
                                            {pageState.family.members.map((m) => (
                                                <option key={m.id} value={m.id} className="bg-white font-medium">
                                                    {m.nameAsInAadhaar} — Age {m.age} · {m.occupation}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>

                                    {/* Selected member detail pill */}
                                    {selectedMemberId && (() => {
                                        const m = pageState.family.members.find((x) => x.id === selectedMemberId);
                                        return m ? (
                                            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 text-sm shadow-sm">
                                                <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--gov-blue)] font-bold text-sm">
                                                    {(m.nameAsInAadhaar || 'M')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-none">{m.nameAsInAadhaar}</p>
                                                    <p className="text-xs font-medium text-slate-500 mt-1">{m.incomeRange} · {m.occupation}</p>
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>

                                {/* Error message */}
                                {submitState.kind === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2.5 shadow-sm ${submitState.code === 409
                                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                                            : 'border-red-200 bg-red-50 text-red-700'
                                            }`}
                                    >
                                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-bold">
                                                {submitState.code === 409 ? 'Duplicate claim' : submitState.code === 403 ? 'Unauthorized' : 'Submission failed'}
                                            </p>
                                            <p className="text-xs font-medium opacity-90 mt-0.5">{submitState.message}</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* KYC Options */}
                                {selectedMemberId && (
                                    <div className="mt-6 border-t border-slate-100 pt-6">
                                        <label className="mb-3 block text-sm font-bold text-slate-700">
                                            Select KYC Verification Method
                                        </label>
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div 
                                                onClick={() => setVerificationMethod('RAZORPAY')}
                                                className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${verificationMethod === 'RAZORPAY' ? 'border-[var(--gov-blue)] bg-blue-50 ring-1 ring-[var(--gov-blue)]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                                            >
                                                <div className="flex justify-center mb-2"><CheckCircle className={`h-5 w-5 ${verificationMethod === 'RAZORPAY' ? 'text-[var(--gov-blue)]' : 'text-slate-400'}`} /></div>
                                                <p className="text-sm font-bold text-slate-900">Instant API Match</p>
                                                <p className="text-xs font-medium text-slate-500 mt-1">1 INR Penny Drop</p>
                                            </div>
                                            <div 
                                                onClick={() => setVerificationMethod('MANUAL')}
                                                className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${verificationMethod === 'MANUAL' ? 'border-[var(--gov-blue)] bg-blue-50 ring-1 ring-[var(--gov-blue)]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                                            >
                                                <div className="flex justify-center mb-2"><FileText className={`h-5 w-5 ${verificationMethod === 'MANUAL' ? 'text-[var(--gov-blue)]' : 'text-slate-400'}`} /></div>
                                                <p className="text-sm font-bold text-slate-900">Manual Upload</p>
                                                <p className="text-xs font-medium text-slate-500 mt-1">Takes 3-5 Days</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selectedMemberId || submitState.kind === 'submitting'}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--gov-blue)] px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
                                >
                                    {submitState.kind === 'submitting' ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" /> {verificationMethod === 'RAZORPAY' ? 'Loading Gateway...' : 'Submitting claim...'}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" /> {verificationMethod === 'RAZORPAY' ? 'Verify via Razorpay (₹1)' : 'Submit Manual Claim'}
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-xs font-bold text-slate-500">
                                    No Aadhaar or PAN data is shared during claim submission.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ClaimPage() {
    return (
        <ProtectedRoute requiredRole="USER">
            <ClaimContent />
        </ProtectedRoute>
    );
}
