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
    const [state, setState] = useState('Andhra Pradesh');
    const [category, setCategory] = useState('General');

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
        m.data.nameAsInAadhaar && m.data.phoneAsInAadhaar && m.data.aadhaar && m.data.incomeRange && m.data.occupation && m.data.age
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
                nameAsInAadhaar: m.data.nameAsInAadhaar.trim(),
                phoneAsInAadhaar: m.data.phoneAsInAadhaar.trim(),
                aadhaar: m.data.aadhaar.trim(),
                pan: m.data.pan.trim() || undefined,
                incomeRange: m.data.incomeRange,
                occupation: m.data.occupation.trim(),
                age: Number(m.data.age),
                gender: m.data.gender,
                religion: m.data.religion,
                physicallyDisabled: m.data.physicallyDisabled,
            }));

            const res = await familyApi.create(payload, members[0].verificationToken, state, category);
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
            <div style={{ background: 'var(--bg-page)', minHeight: 'calc(100vh - 68px)' }}
                className="flex items-center justify-center px-4">
                <div className="card-elevated w-full max-w-lg p-10 text-center" style={{ borderTop: '4px solid #16a34a' }}>
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                        style={{ background: '#dcfce7', border: '2px solid #86efac' }}>
                        <CheckCircle size={40} style={{ color: '#16a34a' }} />
                    </div>
                    <h2 className="mb-2 text-2xl font-black" style={{ color: 'var(--gov-blue)' }}>Registration Submitted!</h2>
                    <p className="mb-6 font-medium" style={{ color: 'var(--text-secondary)' }}>Your family registration is under review by an administrator.</p>
                    <div className="mb-6 rounded-xl p-5" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Temporary Family ID</p>
                        <p className="text-2xl font-mono font-black tracking-widest" style={{ color: 'var(--gov-blue)' }}>
                            {success.temporaryFamilyId}
                        </p>
                    </div>
                    <div className="badge badge-pending mx-auto mb-6">
                        <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--warning)' }} />
                        Status: {success.status}
                    </div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Redirecting to dashboard in 4 seconds…</p>
                </div>
            </div>
        );
    }

    // ── Main Form ─────────────────────────────────────────────────────────────────
    const verifiedCount = members.filter((m) => m.aadhaarStatus === 'verified').length;

    return (
        <div style={{ background: 'var(--bg-page)', minHeight: 'calc(100vh - 68px)' }}>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            {/* Page header */}
            <div className="mb-6 pb-5" style={{ borderBottom: '1.5px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: '#e8f0f8', color: 'var(--gov-blue)' }}>
                        <Users size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: 'var(--gov-blue)' }}>Family Registration</h1>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Register your family for government welfare schemes</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-2"
                        style={{ color: 'var(--text-secondary)' }}>
                        <span>{members.length} member{members.length !== 1 ? 's' : ''} added (max {MAX_MEMBERS})</span>
                        <span>{verifiedCount} / {members.length} Aadhaar verified</span>
                    </div>
                    <div className="h-2 w-full rounded-full" style={{ background: 'var(--bg-hover)' }}>
                        <div className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${members.length > 0 ? (verifiedCount / members.length) * 100 : 0}%`, background: '#16a34a' }} />
                    </div>
                    {!headVerified && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold"
                            style={{ color: 'var(--warning)' }}>
                            <AlertCircle size={13} />
                            The first member (Head of Family) must have their Aadhaar verified to submit.
                        </p>
                    )}
                </div>

                {/* State & Category Selection */}
                <div className="grid grid-cols-2 gap-4 mt-5">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current State *</label>
                        <select 
                            value={state} 
                            onChange={(e) => setState(e.target.value)}
                            className="form-input"
                        >
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                            <option value="Assam">Assam</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Chhattisgarh">Chhattisgarh</option>
                            <option value="Goa">Goa</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                            <option value="Jharkhand">Jharkhand</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Manipur">Manipur</option>
                            <option value="Meghalaya">Meghalaya</option>
                            <option value="Mizoram">Mizoram</option>
                            <option value="Nagaland">Nagaland</option>
                            <option value="Odisha">Odisha</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Sikkim">Sikkim</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Tripura">Tripura</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Uttarakhand">Uttarakhand</option>
                            <option value="West Bengal">West Bengal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Caste Category *</label>
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-input"
                        >
                            <option value="General">General</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="EWS">EWS</option>
                        </select>
                    </div>
                </div>
            </div>

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
                    <button
                        type="button"
                        onClick={addMember}
                        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all"
                        style={{ border: '1.5px dashed var(--border-strong)', color: 'var(--text-secondary)', background: 'transparent' }}
                    >
                        <UserPlus size={16} />
                        Add Family Member ({members.length}/{MAX_MEMBERS})
                    </button>
                )}

                {members.length >= MAX_MEMBERS && (
                    <p className="mt-3 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        Maximum of {MAX_MEMBERS} members reached.
                    </p>
                )}

                {submitError && (
                    <div className="alert alert-error mt-4">
                        <AlertCircle size={16} className="shrink-0" />
                        {submitError}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="btn-primary mt-6 w-full justify-center py-3.5 text-base"
                >
                    {submitting
                        ? <><Loader2 size={18} className="animate-spin" /> Submitting…</>
                        : <><Send size={18} /> Submit Family Registration</>
                    }
                </button>

                {!canSubmit && !submitting && (
                    <p className="mt-2 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {!headVerified
                            ? 'Verify the Head of Family\'s Aadhaar to enable submission'
                            : 'Fill all required fields to continue'}
                    </p>
                )}
            </form>
        </div>
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
