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
    isReadOnly?: boolean;  // true for existing members in update mode
    onChange: (updated: MemberState) => void;
    onRemove: () => void;
}

export default function MemberCard({ index, member, isHead, canRemove, isReadOnly, onChange, onRemove }: MemberCardProps) {
    const [expanded, setExpanded] = useState(!isReadOnly); // collapse existing members by default

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
            className={`rounded-2xl overflow-hidden border transition-all shadow-sm ${
                isReadOnly ? 'bg-blue-50 border-blue-200' :
                verified ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
            }`}
        >
            {/* Card Header */}
            <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                onClick={() => setExpanded((p) => !p)}
                style={{ background: verified ? 'rgba(16, 185, 129, 0.05)' : 'rgba(248, 250, 252, 0.8)' }}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                        verified ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                        {verified ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                        <p className="font-extrabold text-sm uppercase tracking-tight" style={{ color: 'var(--gov-blue)' }}>
                            {member.data.nameAsInAadhaar || `Member ${index + 1}`}
                            {isHead && <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">(HEAD)</span>}
                        </p>
                        <p className="text-[11px] font-bold mt-0.5" style={{ color: isReadOnly ? '#1d4ed8' : verified ? 'var(--success)' : 'var(--text-muted)' }}>
                            {isReadOnly ? '🔒 Registered Member (Read-only)' : verified ? '✓ Aadhaar Verified' : '⚠ Aadhaar verification required'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canRemove && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Remove member"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                    {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
            </div>

            {/* Card Body */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100"
                    >
                        {isReadOnly ? (
                            /* Read-only summary for existing members */
                            <div className="grid gap-3 p-5 sm:grid-cols-2">
                                {[
                                    { label: 'Name', value: member.data.nameAsInAadhaar },
                                    { label: 'Age', value: member.data.age },
                                    { label: 'Gender', value: member.data.gender },
                                    { label: 'Religion', value: member.data.religion },
                                    { label: 'Occupation', value: member.data.occupation },
                                    { label: 'Income Range', value: member.data.incomeRange },
                                ].map(({ label, value }) => (
                                    <div key={label} className="rounded-xl bg-blue-50/50 border border-blue-100 p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-0.5">{label}</p>
                                        <p className="text-sm font-bold text-slate-800">{value || '—'}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                        <div className="grid gap-4 p-5 sm:grid-cols-2">
                            {/* Name */}
                            <InputField icon={<User className="h-4 w-4" />} label="Name as in Aadhaar" required>
                                <input
                                    type="text" value={member.data.nameAsInAadhaar} onChange={(e) => update('nameAsInAadhaar', e.target.value)}
                                    placeholder="e.g. Priya Nair" className="form-input"
                                />
                            </InputField>

                            {/* Phone */}
                            <InputField icon={<Phone className="h-4 w-4" />} label="Phone as in Aadhaar" required>
                                <input
                                    type="tel" maxLength={10} value={member.data.phoneAsInAadhaar} onChange={(e) => update('phoneAsInAadhaar', e.target.value.replace(/\D/g, ''))}
                                    placeholder="10-digit mobile number" className="form-input"
                                />
                            </InputField>

                            {/* Age & Gender */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputField icon={<Calendar className="h-4 w-4" />} label="Age" required>
                                    <input
                                        type="number" min={0} max={120} value={member.data.age} onChange={(e) => update('age', e.target.value)}
                                        placeholder="Age" className="form-input"
                                    />
                                </InputField>
                                <InputField icon={<User className="h-4 w-4" />} label="Gender" required>
                                    <select value={member.data.gender} onChange={(e) => update('gender', e.target.value)} className="form-input">
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
                                        placeholder="e.g. Farmer" className="form-input"
                                    />
                                </InputField>
                                <InputField icon={<User className="h-4 w-4" />} label="Religion" required>
                                    <select value={member.data.religion} onChange={(e) => update('religion', e.target.value)} className="form-input">
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
                                    <select value={member.data.incomeRange} onChange={(e) => update('incomeRange', e.target.value)} className="form-input">
                                        <option value="">Select range</option>
                                        {INCOME_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </InputField>
                                <InputField icon={<ShieldCheck className="h-4 w-4" />} label="Disability" required>
                                    <select value={member.data.physicallyDisabled ? 'true' : 'false'} onChange={(e) => update('physicallyDisabled', e.target.value === 'true' ? true as any : false as any)} className="form-input">
                                        <option value="false">Not Disabled</option>
                                        <option value="true">Disabled</option>
                                    </select>
                                </InputField>
                            </div>

                            {/* Aadhaar */}
                            <InputField icon={<ShieldCheck className="h-4 w-4" />} label="Aadhaar Number" required className="sm:col-span-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text" maxLength={12} value={member.data.aadhaar}
                                        onChange={(e) => update('aadhaar', e.target.value.replace(/\D/g, ''))}
                                        placeholder="12-digit number"
                                        disabled={member.aadhaarStatus === 'verified'}
                                        className="form-input flex-1"
                                    />
                                    {member.aadhaarStatus !== 'verified' && (
                                        <button
                                            type="button"
                                            onClick={handleVerifyAadhaar}
                                            disabled={member.aadhaarStatus === 'sending' || member.data.aadhaar.length !== 12}
                                            className="btn-primary px-4 py-2 text-sm"
                                        >
                                            {member.aadhaarStatus === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                            {member.aadhaarStatus === 'sending' ? 'Sending…' : 'Verify'}
                                        </button>
                                    )}
                                    {member.aadhaarStatus === 'verified' && (
                                        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-100 border border-emerald-200 px-4 text-sm font-bold text-emerald-700">
                                            <CheckCircle className="h-4 w-4" /> Verified
                                        </div>
                                    )}
                                </div>

                                {/* OTP entry */}
                                {(member.aadhaarStatus === 'otp_sent' || member.aadhaarStatus === 'confirming') && (
                                    <div className="mt-3 rounded-xl p-4" style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                                        <p className="text-xs font-bold text-yellow-800 mb-2 uppercase tracking-tight">Enter OTP sent to linked mobile</p>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <input
                                                    type="text" maxLength={6} value={member.aadhaarOtp}
                                                    onChange={(e) => onChange({ ...member, aadhaarOtp: e.target.value.replace(/\D/g, '') })}
                                                    placeholder="6 digits"
                                                    className="form-input bg-white"
                                                />
                                                {member.aadhaarDevOtp && (
                                                    <p className="mt-2 text-xs font-bold text-yellow-700">
                                                        TEST MODE OTP: <span className="bg-yellow-200 px-1.5 py-0.5 rounded font-mono">{member.aadhaarDevOtp}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleConfirmAadhaar}
                                                disabled={member.aadhaarStatus === 'confirming' || member.aadhaarOtp.length !== 6}
                                                className="bg-emerald-600 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                                            >
                                                {member.aadhaarStatus === 'confirming' ? 'Confirming…' : 'Confirm'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {member.aadhaarError && (
                                    <p className="mt-2 text-xs font-bold text-red-600">{member.aadhaarError}</p>
                                )}
                            </InputField>

                            {/* PAN */}
                            <InputField icon={<CreditCard className="h-4 w-4" />} label="PAN (Optional)" className="sm:col-span-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text" maxLength={10} value={member.data.pan}
                                        onChange={(e) => {
                                            update('pan', e.target.value.toUpperCase());
                                            if (member.panStatus !== 'idle') onChange({ ...member, data: { ...member.data, pan: e.target.value.toUpperCase() }, panStatus: 'idle', panMessage: '' });
                                        }}
                                        placeholder="ABCDE1234F"
                                        className="form-input flex-1"
                                    />
                                    {member.data.pan && member.panStatus !== 'valid' && (
                                        <button
                                            type="button"
                                            onClick={handleVerifyPan}
                                            disabled={member.panStatus === 'checking' || member.data.pan.length < 10}
                                            className="px-4 py-2 text-sm font-bold border-2 border-slate-200 rounded-xl hover:border-gov-gold hover:text-gov-gold transition-all disabled:opacity-50"
                                            style={{ color: 'var(--gov-blue)' }}
                                        >
                                            {member.panStatus === 'checking' ? 'Validating…' : 'Validate'}
                                        </button>
                                    )}
                                    {member.panStatus === 'valid' && (
                                        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-100 border border-emerald-200 px-4 text-sm font-bold text-emerald-700">
                                            <CheckCircle className="h-4 w-4" /> Valid
                                        </div>
                                    )}
                                </div>
                                {member.panMessage && (
                                    <p className={`mt-1.5 text-xs font-bold ${member.panStatus === 'valid' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {member.panMessage}
                                    </p>
                                )}
                            </InputField>
                        </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function InputField({
    icon, label, required, children, className = '',
}: { icon: React.ReactNode; label: string; required?: boolean; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--gov-gold)' }}>{icon}</span>
                {label}
                {required && <span className="text-red-600 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

