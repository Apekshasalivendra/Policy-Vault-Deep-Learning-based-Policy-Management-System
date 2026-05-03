'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Loader2, AlertCircle, ChevronDown, ChevronUp,
    User, Users, Percent, BookOpen, CheckCircle, ArrowRight,
    X, Upload, CreditCard, UserCheck, Skull, Camera,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { familyApi, policyApi } from '@/lib/api';

interface Nominee { id: string; name: string; relation: string; percentage: number; }
interface Policy {
    id: string; name: string; type: string; amount: number;
    holderId: string; holderName: string; nominees: Nominee[];
}
interface ClaimSubmitted { policyId: string; memberId: string; }

// ── Multi-step wizard ─────────────────────────────────────────────────────────
type Step = 'claimant' | 'document' | 'kyc' | 'done';

function PolicyClaimWizard({
    policy, familyId, onClose, onSuccess,
}: {
    policy: Policy; familyId: string;
    onClose: () => void; onSuccess: (policyId: string, memberId: string) => void;
}) {
    const [step, setStep] = useState<Step>('claimant');
    const [claimantType, setClaimantType] = useState<'holder_alive' | 'nominee' | null>(null);
    const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);
    const [docUploaded, setDocUploaded] = useState(false);
    const [docName, setDocName] = useState('');
    const [kycLoading, setKycLoading] = useState(false);
    const [kycDone, setKycDone] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const claimant = claimantType === 'holder_alive'
        ? { id: policy.holderId, name: policy.holderName, percentage: 100 }
        : selectedNominee
            ? { id: selectedNominee.id, name: selectedNominee.name, percentage: selectedNominee.percentage }
            : null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { setDocName(f.name); setDocUploaded(true); }
    };

    const handleKyc = () => {
        setKycLoading(true);
        setTimeout(() => { setKycLoading(false); setKycDone(true); }, 1800);
    };

    const handleSubmit = async () => {
        if (!claimant) return;
        setSubmitting(true);
        try {
            await policyApi.submitClaim(familyId, {
                policyId: policy.id,
                policyName: policy.name,
                memberId: claimant.id,
                memberName: claimant.name,
                percentage: claimant.percentage,
                nominees: policy.nominees,
            });
            setStep('done');
            onSuccess(policy.id, claimant.id);
        } catch { setSubmitting(false); }
    };

    const steps = ['claimant', 'document', 'kyc', 'done'];
    const stepIdx = steps.indexOf(step);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-violet-200 text-xs font-bold uppercase tracking-wider">Collecting Policy</p>
                        <h2 className="text-white font-black text-lg">{policy.name}</h2>
                    </div>
                    <button onClick={onClose} className="text-violet-300 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Step indicator */}
                {step !== 'done' && (
                    <div className="flex px-6 py-3 gap-2 bg-violet-50 border-b border-violet-100">
                        {['Who is Claiming', 'Upload Document', 'KYC Verification'].map((label, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className={`h-1.5 w-full rounded-full transition-all ${i <= stepIdx ? 'bg-violet-600' : 'bg-slate-200'}`} />
                                <span className={`text-[10px] font-bold ${i === stepIdx ? 'text-violet-700' : 'text-slate-400'}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="px-6 py-6">
                    <AnimatePresence mode="wait">
                        {/* ── STEP 1: Who is claiming ─────────────────────── */}
                        {step === 'claimant' && (
                            <motion.div key="claimant" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <p className="font-black text-slate-900 text-base mb-4">Who is claiming this policy?</p>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { setClaimantType('holder_alive'); setSelectedNominee(null); }}
                                        className={`w-full flex items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-all ${claimantType === 'holder_alive' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-violet-300'}`}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 shrink-0">
                                            <UserCheck className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Policy Holder is Alive</p>
                                            <p className="text-xs text-slate-500">Claimant: <span className="font-semibold text-slate-700">{policy.holderName}</span> · 100% share</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setClaimantType('nominee')}
                                        className={`w-full flex items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-all ${claimantType === 'nominee' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-violet-300'}`}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 shrink-0">
                                            <Skull className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Policy Holder is Deceased</p>
                                            <p className="text-xs text-slate-500">A nominee will collect the benefit</p>
                                        </div>
                                    </button>
                                </div>

                                {claimantType === 'nominee' && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Nominee</p>
                                        {policy.nominees.map(n => (
                                            <button
                                                key={n.id}
                                                onClick={() => setSelectedNominee(n)}
                                                className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${selectedNominee?.id === n.id ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-violet-300'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <User size={14} className="text-slate-400" />
                                                    <span className="font-semibold text-slate-800 text-sm">{n.name}</span>
                                                </div>
                                                <span className="font-black text-violet-700 text-sm">{n.percentage}%</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                <button
                                    onClick={() => setStep('document')}
                                    disabled={!claimantType || (claimantType === 'nominee' && !selectedNominee)}
                                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-all disabled:opacity-40"
                                >
                                    Next: Upload Document <ArrowRight size={15} />
                                </button>
                            </motion.div>
                        )}

                        {/* ── STEP 2: Upload document ─────────────────────── */}
                        {step === 'document' && (
                            <motion.div key="doc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <p className="font-black text-slate-900 text-base mb-1">Upload Claim Document</p>
                                <p className="text-xs text-slate-500 mb-5">
                                    {claimantType === 'nominee'
                                        ? 'Upload Death Certificate of the policy holder'
                                        : 'Upload a valid ID proof or policy document'}
                                </p>

                                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className={`w-full rounded-xl border-2 border-dashed py-10 flex flex-col items-center gap-3 transition-all ${docUploaded ? 'border-violet-400 bg-violet-50' : 'border-slate-300 hover:border-violet-400 hover:bg-violet-50'}`}
                                >
                                    {docUploaded ? (
                                        <>
                                            <CheckCircle className="h-10 w-10 text-violet-600" />
                                            <p className="font-bold text-violet-700 text-sm">{docName}</p>
                                            <p className="text-xs text-slate-400">Click to change</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                                <Camera className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="font-bold text-slate-600">Click to upload document</p>
                                            <p className="text-xs text-slate-400">Image or PDF · Max 5MB</p>
                                        </>
                                    )}
                                </button>

                                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                                    <p className="text-xs font-semibold text-amber-700">⚠️ Document is stored temporarily and deleted after admin review</p>
                                </div>

                                <button
                                    onClick={() => setStep('kyc')}
                                    disabled={!docUploaded}
                                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-all disabled:opacity-40"
                                >
                                    Next: KYC Verification <ArrowRight size={15} />
                                </button>
                            </motion.div>
                        )}

                        {/* ── STEP 3: KYC ────────────────────────────────── */}
                        {step === 'kyc' && (
                            <motion.div key="kyc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <p className="font-black text-slate-900 text-base mb-1">KYC Verification</p>
                                <p className="text-xs text-slate-500 mb-5">A mock bank verification will be performed to confirm your identity</p>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5 mb-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-violet-500 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Claimant</p>
                                            <p className="font-bold text-slate-900 text-sm">{claimant?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-violet-500 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Policy</p>
                                            <p className="font-bold text-slate-900 text-sm">{policy.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Percent className="h-5 w-5 text-violet-500 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Claim Share</p>
                                            <p className="font-bold text-violet-700 text-sm">{claimant?.percentage}% of ₹{policy.amount.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>

                                {kycDone ? (
                                    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-4">
                                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                                        <p className="text-sm font-bold text-emerald-700">KYC Verified Successfully</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleKyc}
                                        disabled={kycLoading}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-violet-200 bg-white py-3 text-sm font-bold text-violet-700 hover:bg-violet-50 transition-all disabled:opacity-60 mb-4"
                                    >
                                        {kycLoading ? <><Loader2 size={15} className="animate-spin" />Verifying…</> : <><CreditCard size={15} />Run Mock KYC (Penny Drop)</>}
                                    </button>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={!kycDone || submitting}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-all disabled:opacity-40"
                                >
                                    {submitting ? <><Loader2 size={15} className="animate-spin" />Submitting…</> : <>Submit Claim to Admin <ArrowRight size={15} /></>}
                                </button>
                            </motion.div>
                        )}

                        {/* ── STEP 4: Done ────────────────────────────────── */}
                        {step === 'done' && (
                            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center gap-4">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 border-4 border-emerald-200">
                                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-xl">Claim Submitted!</p>
                                    <p className="text-slate-500 text-sm mt-1">Your policy claim is now <span className="font-bold text-amber-600">On Hold</span> pending admin review.</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 text-left w-full space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Policy</span><span className="font-bold">{policy.name}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Claimant</span><span className="font-bold">{claimant?.name}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Share</span><span className="font-bold text-violet-700">{claimant?.percentage}%</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Status</span><span className="font-bold text-amber-600">On Hold — Admin Review</span></div>
                                </div>
                                <button onClick={onClose} className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-all">
                                    Done
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

// ── Policy Card ───────────────────────────────────────────────────────────────
function PolicyCard({ policy, familyId, onClaim, claimed }: {
    policy: Policy; familyId: string; claimed: boolean;
    onClaim: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-between">
                <div>
                    <span className="text-violet-200 text-xs font-bold uppercase tracking-wider">{policy.type}</span>
                    <h3 className="text-white font-black text-lg mt-0.5">{policy.name}</h3>
                </div>
                <div className="text-right">
                    <p className="text-violet-200 text-xs font-semibold">Sum Assured</p>
                    <p className="text-white font-black text-xl">₹{policy.amount.toLocaleString('en-IN')}</p>
                </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-100 bg-slate-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100">
                    <User className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Policy Holder</p>
                    <p className="font-bold text-slate-900 text-sm">{policy.holderName}</p>
                </div>
            </div>

            <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <p className="text-sm font-bold text-slate-700">Nominees &amp; Shares</p>
                    </div>
                    <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                        {expanded ? <><ChevronUp size={12} />Hide</> : <><ChevronDown size={12} />Details</>}
                    </button>
                </div>
                <div className="space-y-2">
                    {policy.nominees.map((n, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" style={{ width: `${n.percentage}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 w-20 truncate">{n.name}</span>
                            <span className="text-xs font-black text-violet-700 w-10 text-right">{n.percentage}%</span>
                        </div>
                    ))}
                </div>

                <AnimatePresence>
                    {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 space-y-2">
                            {policy.nominees.map(n => (
                                <div key={n.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                                    <span className="font-medium text-slate-700">{n.name} · {n.relation}</span>
                                    <span className="font-black text-violet-700">{n.percentage}%</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                {claimed ? (
                    <div className="flex items-center gap-2 justify-center">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <span className="font-bold text-emerald-700 text-sm">Claim Submitted — Pending Admin Review</span>
                    </div>
                ) : (
                    <button
                        onClick={onClaim}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-all"
                    >
                        <ArrowRight size={15} /> Collect / Claim This Policy
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function PoliciesContent() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [familyId, setFamilyId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState<ClaimSubmitted[]>([]);
    const [activePolicy, setActivePolicy] = useState<Policy | null>(null);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        familyApi.getMyFamily().then((r: any) => {
            const fam = r.data?.family;
            if (!fam?.id) { setError('No approved family found. Register your family first.'); setLoading(false); return; }
            setFamilyId(fam.id);
            return policyApi.getForFamily(fam.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).then((r: any) => {
            if (r) setPolicies(r.data?.policies ?? []);
        }).catch(() => setError('Could not load policies.')).finally(() => setLoading(false));
    }, []);

    const isClaimed = (id: string) => submitted.some(s => s.policyId === id);

    return (
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            {activePolicy && (
                <PolicyClaimWizard
                    policy={activePolicy}
                    familyId={familyId}
                    onClose={() => setActivePolicy(null)}
                    onSuccess={(policyId, memberId) => {
                        setSubmitted(p => [...p, { policyId, memberId }]);
                        setActivePolicy(null);
                    }}
                />
            )}

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-4 border-b border-slate-200 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 border border-violet-200">
                    <BookOpen className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">My Policies</h1>
                    <p className="text-sm text-slate-500">View your LIC and insurance policies. Click Collect to start the claim process.</p>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-violet-600">
                    <Loader2 className="h-7 w-7 animate-spin" /><span className="text-sm font-bold">Loading your policies…</span>
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                    <AlertCircle className="h-5 w-5 shrink-0" /> {error}
                </div>
            ) : policies.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
                        <Shield className="h-8 w-8 text-violet-500" />
                    </div>
                    <p className="font-bold text-slate-900 text-lg">No policies found</p>
                    <p className="text-slate-500 text-sm max-w-xs">Ensure your family is registered and approved.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {policies.map(policy => (
                        <PolicyCard
                            key={policy.id}
                            policy={policy}
                            familyId={familyId}
                            claimed={isClaimed(policy.id)}
                            onClaim={() => setActivePolicy(policy)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PoliciesPage() {
    return <ProtectedRoute requiredRole="USER"><PoliciesContent /></ProtectedRoute>;
}
