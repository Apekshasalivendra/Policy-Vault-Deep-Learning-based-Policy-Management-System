'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Phone, CreditCard, Briefcase, DollarSign, Calendar,
    CheckCircle, Loader2, ChevronDown, ChevronUp, Trash2, ShieldCheck,
} from 'lucide-react';
import { mockApi } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────
export interface MemberData {
    nameAsInAadhaar: string;
    phoneAsInAadhaar: string;
    aadhaar: string;
    pan: string;
    incomeRange: string;
    occupation: string;
    age: string; // kept as string for input, parsed on submit
    gender: string;
    religion: string;
    physicallyDisabled: boolean;
}

export interface MemberState {
    data: MemberData;
    // Aadhaar OTP flow
    aadhaarStatus: 'idle' | 'sending' | 'otp_sent' | 'confirming' | 'verified' | 'error';
    aadhaarOtp: string;
    aadhaarDevOtp: string;  // shown in dev mode
    aadhaarError: string;
    verificationToken: string;  // set on confirmed
    // PAN flow
    panStatus: 'idle' | 'checking' | 'valid' | 'invalid';
    panMessage: string;
}

export const emptyMember = (): MemberState => ({
    data: { nameAsInAadhaar: '', phoneAsInAadhaar: '', aadhaar: '', pan: '', incomeRange: '', occupation: '', age: '', gender: 'Male', religion: 'Hindu', physicallyDisabled: false },
    aadhaarStatus: 'idle',
    aadhaarOtp: '',
    aadhaarDevOtp: '',
    aadhaarError: '',
    verificationToken: '',
    panStatus: 'idle',
    panMessage: '',
});

const INCOME_RANGES = [
    'Below ₹1 Lakh', '₹1–3 Lakh', '₹3–6 Lakh', '₹6–10 Lakh', 'Above ₹10 Lakh',
];

interface MemberCardProps {
    index: number;
    member: MemberState;
    isHead: boolean;       // first member = head of family
    canRemove: boolean;
    onChange: (updated: MemberState) => void;
    onRemove: () => void;
}

export default function MemberCard({ index, member, isHead, canRemove, onChange, onRemove }: MemberCardProps) {
    const [expanded, setExpanded] = useState(true);

    const update = (field: keyof MemberData, value: string) =>
        onChange({ ...member, data: { ...member.data, [field]: value } });

    // ── Aadhaar OTP ─────────────────────────────────────────────────────────────
    const handleVerifyAadhaar = async () => {
        if (!/^\d{12}$/.test(member.data.aadhaar)) {
            onChange({ ...member, aadhaarError: 'Aadhaar must be exactly 12 digits', aadhaarStatus: 'error' });
            return;
        }
        onChange({ ...member, aadhaarStatus: 'sending', aadhaarError: '' });
        try {
            const res = await mockApi.verifyAadhaar(member.data.aadhaar);
            onChange({ ...member, aadhaarStatus: 'otp_sent', aadhaarDevOtp: res.data.otp, aadhaarError: '' });
        } catch {
            onChange({ ...member, aadhaarStatus: 'error', aadhaarError: 'Failed to send OTP. Check Aadhaar number.' });
        }
    };

    const handleConfirmAadhaar = async () => {
        onChange({ ...member, aadhaarStatus: 'confirming', aadhaarError: '' });
        try {
            const res = await mockApi.confirmAadhaar(member.data.aadhaar, member.aadhaarOtp);
            onChange({ ...member, aadhaarStatus: 'verified', verificationToken: res.data.verificationToken, aadhaarError: '' });
        } catch {
            onChange({ ...member, aadhaarStatus: 'error', aadhaarError: 'Invalid OTP. Try again.' });
        }
    };

    // ── PAN Validation ───────────────────────────────────────────────────────────
    const handleVerifyPan = async () => {
        if (!member.data.pan) return;
        onChange({ ...member, panStatus: 'checking', panMessage: '' });
        try {
            const res = await mockApi.verifyPan(member.data.pan);
            onChange({ ...member, panStatus: res.data.verified ? 'valid' : 'invalid', panMessage: res.data.message });
        } catch {
            onChange({ ...member, panStatus: 'invalid', panMessage: 'PAN validation failed' });
        }
    };

    const verified = member.aadhaarStatus === 'verified';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`glass-card rounded-2xl overflow-hidden border transition-all ${verified ? 'border-emerald-500/30' : 'border-white/8'
                }`}
        >
            {/* Card Header */}
            <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                onClick={() => setExpanded((p) => !p)}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-600/20 text-indigo-400'
                        }`}>
                        {verified ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                        <p className="font-medium text-white text-sm">
                            {member.data.nameAsInAadhaar || `Member ${index + 1}`}
                            {isHead && <span className="ml-2 text-xs text-indigo-400 font-normal">(Head of Family)</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                            {verified ? 'Aadhaar verified ✓' : 'Aadhaar not verified'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canRemove && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Remove member"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                    {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </div>
            </div>

            {/* Card Body */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-white/5"
                    >
                        <div className="grid gap-4 p-5 sm:grid-cols-2">
                            {/* Name */}
                            <InputField icon={<User className="h-4 w-4" />} label="Name as in Aadhaar" required>
                                <input
                                    type="text" value={member.data.nameAsInAadhaar} onChange={(e) => update('nameAsInAadhaar', e.target.value)}
                                    placeholder="e.g. Priya Nair" className={inputClass}
                                />
                            </InputField>

                            {/* Phone */}
                            <InputField icon={<Phone className="h-4 w-4" />} label="Phone as in Aadhaar" required>
                                <input
                                    type="tel" maxLength={10} value={member.data.phoneAsInAadhaar} onChange={(e) => update('phoneAsInAadhaar', e.target.value.replace(/\D/g, ''))}
                                    placeholder="10-digit mobile number" className={inputClass}
                                />
                            </InputField>

                            {/* Age & Gender */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputField icon={<Calendar className="h-4 w-4" />} label="Age" required>
                                    <input
                                        type="number" min={0} max={120} value={member.data.age} onChange={(e) => update('age', e.target.value)}
                                        placeholder="Age in years" className={inputClass}
                                    />
                                </InputField>
                                <InputField icon={<User className="h-4 w-4" />} label="Gender" required>
                                    <select value={member.data.gender} onChange={(e) => update('gender', e.target.value)} className={inputClass}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </InputField>
                            </div>

                            {/* Occupation & Religion */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputField icon={<Briefcase className="h-4 w-4" />} label="Occupation" required>
                                    <input
                                        type="text" value={member.data.occupation} onChange={(e) => update('occupation', e.target.value)}
                                        placeholder="e.g. Farmer" className={inputClass}
                                    />
                                </InputField>
                                <InputField icon={<User className="h-4 w-4" />} label="Religion" required>
                                    <select value={member.data.religion} onChange={(e) => update('religion', e.target.value)} className={inputClass}>
                                        <option value="Hindu">Hindu</option>
                                        <option value="Muslim">Muslim</option>
                                        <option value="Christian">Christian</option>
                                        <option value="Sikh">Sikh</option>
                                        <option value="Buddhist">Buddhist</option>
                                        <option value="Jain">Jain</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </InputField>
                            </div>

                            {/* Income Range & Disability */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputField icon={<DollarSign className="h-4 w-4" />} label="Income Range" required>
                                    <select value={member.data.incomeRange} onChange={(e) => update('incomeRange', e.target.value)} className={inputClass}>
                                        <option value="">Select income range</option>
                                        {INCOME_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </InputField>
                                <InputField icon={<ShieldCheck className="h-4 w-4" />} label="Disability Status" required>
                                    <select value={member.data.physicallyDisabled ? 'true' : 'false'} onChange={(e) => update('physicallyDisabled', e.target.value === 'true' ? true as any : false as any)} className={inputClass}>
                                        <option value="false">Not Disabled</option>
                                        <option value="true">Physically Disabled</option>
                                    </select>
                                </InputField>
                            </div>

                            {/* Aadhaar */}
                            <InputField icon={<ShieldCheck className="h-4 w-4" />} label="Aadhaar Number" required className="sm:col-span-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text" maxLength={12} value={member.data.aadhaar}
                                        onChange={(e) => update('aadhaar', e.target.value.replace(/\D/g, ''))}
                                        placeholder="12-digit Aadhaar number"
                                        disabled={member.aadhaarStatus === 'verified'}
                                        className={`${inputClass} flex-1`}
                                    />
                                    {member.aadhaarStatus !== 'verified' && (
                                        <button
                                            type="button"
                                            onClick={handleVerifyAadhaar}
                                            disabled={member.aadhaarStatus === 'sending' || member.data.aadhaar.length !== 12}
                                            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {member.aadhaarStatus === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                            {member.aadhaarStatus === 'sending' ? 'Sending…' : 'Verify'}
                                        </button>
                                    )}
                                    {member.aadhaarStatus === 'verified' && (
                                        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 text-sm text-emerald-400">
                                            <CheckCircle className="h-4 w-4" /> Verified
                                        </div>
                                    )}
                                </div>

                                {/* OTP entry — dev mode shows OTP hint */}
                                {(member.aadhaarStatus === 'otp_sent' || member.aadhaarStatus === 'confirming') && (
                                    <div className="mt-2 flex gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="text" maxLength={6} value={member.aadhaarOtp}
                                                onChange={(e) => onChange({ ...member, aadhaarOtp: e.target.value.replace(/\D/g, '') })}
                                                placeholder="Enter 6-digit OTP"
                                                className={inputClass}
                                            />
                                            {member.aadhaarDevOtp && (
                                                <p className="mt-1 text-xs text-amber-500/80">
                                                    🧪 Dev OTP: <span className="font-mono font-bold">{member.aadhaarDevOtp}</span>
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleConfirmAadhaar}
                                            disabled={member.aadhaarStatus === 'confirming' || member.aadhaarOtp.length !== 6}
                                            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {member.aadhaarStatus === 'confirming' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                            {member.aadhaarStatus === 'confirming' ? 'Confirming…' : 'Confirm OTP'}
                                        </button>
                                    </div>
                                )}
                                {member.aadhaarError && (
                                    <p className="mt-1.5 text-xs text-red-400">{member.aadhaarError}</p>
                                )}
                            </InputField>

                            {/* PAN */}
                            <InputField icon={<CreditCard className="h-4 w-4" />} label="PAN (optional)" className="sm:col-span-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text" maxLength={10} value={member.data.pan}
                                        onChange={(e) => {
                                            update('pan', e.target.value.toUpperCase());
                                            if (member.panStatus !== 'idle') onChange({ ...member, data: { ...member.data, pan: e.target.value.toUpperCase() }, panStatus: 'idle', panMessage: '' });
                                        }}
                                        placeholder="e.g. ABCDE1234F"
                                        className={`${inputClass} flex-1`}
                                    />
                                    {member.data.pan && member.panStatus !== 'valid' && (
                                        <button
                                            type="button"
                                            onClick={handleVerifyPan}
                                            disabled={member.panStatus === 'checking' || member.data.pan.length < 10}
                                            className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300 disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {member.panStatus === 'checking' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                            {member.panStatus === 'checking' ? 'Checking…' : 'Validate'}
                                        </button>
                                    )}
                                    {member.panStatus === 'valid' && (
                                        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 text-sm text-emerald-400">
                                            <CheckCircle className="h-4 w-4" /> Valid
                                        </div>
                                    )}
                                </div>
                                {member.panMessage && (
                                    <p className={`mt-1 text-xs ${member.panStatus === 'valid' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {member.panMessage}
                                    </p>
                                )}
                            </InputField>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

function InputField({
    icon, label, required, children, className = '',
}: { icon: React.ReactNode; label: string; required?: boolean; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <span className="text-slate-500">{icon}</span>
                {label}
                {required && <span className="text-red-400">*</span>}
            </label>
            {children}
        </div>
    );
}
