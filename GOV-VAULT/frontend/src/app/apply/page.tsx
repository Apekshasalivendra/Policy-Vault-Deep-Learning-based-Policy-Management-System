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
            <div className="flex items-center justify-center px-4" style={{ background: '#f8fafc', minHeight: 'calc(100vh - 68px)' }}>
                <div className="card-elevated w-full max-w-lg p-10 text-center bg-white" style={{ borderTop: '6px solid #16a34a' }}>
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 border-4 border-emerald-100">
                        <CheckCircle size={48} className="text-emerald-600" />
                    </div>
                    <h2 className="mb-3 text-3xl font-black" style={{ color: 'var(--gov-blue)' }}>Submission Successful</h2>
                    <p className="mb-8 font-bold text-slate-700">Your family registration is now pending official review.</p>
                    
                    <div className="mb-8 rounded-2xl p-6 bg-slate-50 border-2 border-slate-100">
                        <p className="text-xs font-black uppercase tracking-widest mb-2 text-slate-600">Temporary Family ID</p>
                        <p className="text-3xl font-mono font-black tracking-widest" style={{ color: 'var(--gov-blue)' }}>
                            {success.temporaryFamilyId}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="badge px-6 py-3 bg-yellow-100 border-2 border-yellow-200 text-yellow-800 font-black rounded-full text-sm">
                            STATUS: {success.status.toUpperCase()}
                        </div>
                        <p className="text-sm font-bold text-slate-600 animate-pulse">Redirecting to dashboard in 4 seconds…</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main Form ─────────────────────────────────────────────────────────────────
    const verifiedCount = members.filter((m) => m.aadhaarStatus === 'verified').length;

    return (
        <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 68px)' }}>
            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                {/* Page header */}
                <div className="mb-8 pb-6 border-b-2 border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                            <Users size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--gov-blue)' }}>Family Registration</h1>
                            <p className="text-base font-bold text-slate-700">Official Onboarding for Government Welfare Services</p>
                        </div>
                    </div>

                    {/* Progress Card */}
                    <div className="mt-8 rounded-2xl p-6 bg-white border-2 border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between text-sm font-black mb-3 text-slate-800">
                            <span className="uppercase tracking-tight">Registration Progress</span>
                            <span className="text-indigo-700">{verifiedCount} / {members.length} VERIFIED</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full transition-all duration-700 ease-out"
                                style={{ width: `${members.length > 0 ? (verifiedCount / members.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)' }} />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-700">
                                {members.length} Member{members.length !== 1 ? 's' : ''} added
                            </p>
                            {!headVerified && (
                                <p className="flex items-center gap-1.5 text-xs font-black text-red-600 animate-pulse">
                                    <AlertCircle size={14} />
                                    HEAD OF FAMILY VERIFICATION REQUIRED
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Global Context Selection */}
                    <div className="grid grid-cols-2 gap-6 mt-8">
                        <div className="space-y-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-600">Primary Residence (State) *</label>
                            <select 
                                value={state} 
                                onChange={(e) => setState(e.target.value)}
                                className="form-input bg-white font-bold h-12"
                                style={{ color: 'var(--text-primary)' }}
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
                        <div className="space-y-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-600">Caste / Category *</label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                className="form-input bg-white font-bold h-12"
                                style={{ color: 'var(--text-primary)' }}
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
                    <div className="space-y-6">
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
                            className="mt-6 w-full flex items-center justify-center gap-3 rounded-2xl py-5 text-sm font-black transition-all border-2 border-dashed border-slate-300 bg-slate-50 text-slate-700 hover:bg-white hover:border-indigo-400 hover:text-indigo-600"
                        >
                            <UserPlus size={20} />
                            ADD FAMILY MEMBER ({members.length}/{MAX_MEMBERS})
                        </button>
                    )}

                    {submitError && (
                        <div className="mt-6 p-4 rounded-xl bg-red-50 border-2 border-red-100 flex items-center gap-3 text-red-700 font-bold">
                            <AlertCircle size={20} className="shrink-0" />
                            {submitError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="btn-primary mt-8 w-full justify-center py-4 text-lg font-black shadow-xl shadow-indigo-100"
                    >
                        {submitting
                            ? <><Loader2 size={24} className="animate-spin" /> PROCESSING…</>
                            : <><Send size={20} /> SUBMIT OFFICIAL REGISTRATION</>
                        }
                    </button>

                    {!canSubmit && !submitting && (
                        <p className="mt-4 text-center text-sm font-black uppercase tracking-tight text-slate-700">
                            {!headVerified
                                ? '⚠️ Verification of Head of Family required to proceed'
                                : 'Please complete all required fields'}
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
