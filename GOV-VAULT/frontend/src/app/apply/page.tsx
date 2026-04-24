'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import MemberCard, { MemberState, emptyMember } from '@/components/forms/MemberCard';
import { familyApi } from '@/lib/api';

const MAX_MEMBERS = 8;

interface SuccessData {
    temporaryFamilyId: string;
    status: string;
}

function ApplyContent() {
    const router = useRouter();
    const [members, setMembers] = useState<MemberState[]>([emptyMember()]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState<SuccessData | null>(null);

    // ── Member management ────────────────────────────────────────────────────────
    const addMember = () => {
        if (members.length >= MAX_MEMBERS) return;
        setMembers((prev) => [...prev, emptyMember()]);
    };

    const removeMember = (i: number) =>
        setMembers((prev) => prev.filter((_, idx) => idx !== i));

    const updateMember = (i: number, updated: MemberState) =>
        setMembers((prev) => prev.map((m, idx) => (idx === i ? updated : m)));

    // ── Validation ───────────────────────────────────────────────────────────────
    const headVerified = members[0]?.aadhaarStatus === 'verified';
    const allRequired = members.every((m) =>
        m.data.name && m.data.phone && m.data.aadhaar && m.data.incomeRange && m.data.occupation && m.data.age
    );
    const canSubmit = headVerified && allRequired && !submitting;

    // ── Submit ───────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitError('');
        setSubmitting(true);

        try {
            const payload = members.map((m) => ({
                name: m.data.name.trim(),
                phone: m.data.phone.trim(),
                aadhaar: m.data.aadhaar.trim(),
                pan: m.data.pan.trim() || undefined,
                incomeRange: m.data.incomeRange,
                occupation: m.data.occupation.trim(),
                age: Number(m.data.age),
            }));

            const res = await familyApi.create(payload, members[0].verificationToken);
            const { temporaryFamilyId, status } = res.data.family;
            setSuccess({ temporaryFamilyId, status });

            // Auto-redirect after 4 seconds
            setTimeout(() => router.push('/dashboard'), 4000);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                'Submission failed. Please try again.';
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success Screen ────────────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card w-full max-w-lg rounded-3xl p-10 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30"
                    >
                        <CheckCircle className="h-10 w-10 text-emerald-400" />
                    </motion.div>

                    <h2 className="mb-2 text-2xl font-bold text-white">Registration Submitted!</h2>
                    <p className="mb-6 text-slate-400">Your family registration is under review.</p>

                    <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6">
                        <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Temporary Family ID</p>
                        <p className="text-3xl font-mono font-bold tracking-widest text-indigo-300">
                            {success.temporaryFamilyId}
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400 mb-6">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        Status: {success.status}
                    </div>

                    <p className="text-xs text-slate-600">Redirecting to dashboard in 4 seconds…</p>
                </motion.div>
            </div>
        );
    }

    // ── Main Form ─────────────────────────────────────────────────────────────────
    const verifiedCount = members.filter((m) => m.aadhaarStatus === 'verified').length;

    return (
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30">
                        <Users className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Family Registration</h1>
                        <p className="text-sm text-slate-500">Register your family for government welfare schemes</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>{members.length} member{members.length !== 1 ? 's' : ''} added (max {MAX_MEMBERS})</span>
                        <span>{verifiedCount} / {members.length} Aadhaar verified</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5">
                        <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${members.length > 0 ? (verifiedCount / members.length) * 100 : 0}%` }}
                        />
                    </div>
                    {!headVerified && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-500/80">
                            <AlertCircle className="h-3.5 w-3.5" />
                            The first member (Head of Family) must have their Aadhaar verified to submit.
                        </p>
                    )}
                </div>
            </motion.div>

            {/* Members list */}
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {members.map((member, i) => (
                            <MemberCard
                                key={i}
                                index={i}
                                member={member}
                                isHead={i === 0}
                                canRemove={members.length > 1}
                                onChange={(updated) => updateMember(i, updated)}
                                onRemove={() => removeMember(i)}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Add member button */}
                {members.length < MAX_MEMBERS && (
                    <motion.button
                        type="button"
                        onClick={addMember}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-4 text-sm text-slate-500 hover:border-indigo-500/40 hover:text-indigo-400 transition-all"
                    >
                        <UserPlus className="h-4 w-4" />
                        Add Family Member ({members.length}/{MAX_MEMBERS})
                    </motion.button>
                )}

                {members.length >= MAX_MEMBERS && (
                    <p className="mt-3 text-center text-xs text-slate-600">
                        Maximum of {MAX_MEMBERS} members reached.
                    </p>
                )}

                {/* Submit error */}
                {submitError && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                    >
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        {submitError}
                    </motion.div>
                )}

                {/* Submit button */}
                <motion.button
                    type="submit"
                    disabled={!canSubmit}
                    whileHover={canSubmit ? { scale: 1.01 } : {}}
                    whileTap={canSubmit ? { scale: 0.99 } : {}}
                    className="mt-6 w-full flex items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 py-4 font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-base shadow-lg shadow-indigo-500/20"
                >
                    {submitting
                        ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
                        : <><Send className="h-5 w-5" /> Submit Family Registration</>
                    }
                </motion.button>

                {!canSubmit && !submitting && (
                    <p className="mt-2 text-center text-xs text-slate-600">
                        {!headVerified
                            ? 'Verify the Head of Family\'s Aadhaar to enable submission'
                            : 'Fill all required fields to continue'}
                    </p>
                )}
            </form>
        </div>
    );
}

export default function ApplyPage() {
    return (
        <ProtectedRoute requiredRole="USER">
            <ApplyContent />
        </ProtectedRoute>
    );
}
