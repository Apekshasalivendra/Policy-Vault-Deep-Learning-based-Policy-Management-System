'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, Loader2, CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';

// ── Password strength checker ─────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
    if (score === 2) return { score, label: 'Fair', color: '#f97316' };
    if (score === 3) return { score, label: 'Good', color: '#eab308' };
    if (score === 4) return { score, label: 'Strong', color: '#22c55e' };
    return { score, label: 'Very Strong', color: '#10b981' };
}

const REQUIREMENTS = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One number (0–9)', test: (p: string) => /[0-9]/.test(p) },
    { label: 'One special character (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const strength = getStrength(password);
    const allRequirementsMet = REQUIREMENTS.every(r => r.test(password));

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!allRequirementsMet) {
            setError('Please meet all password requirements before continuing.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await authApi.register(email, password);
            setSuccess(true);
            await login(email, password);
            router.push('/dashboard');
        } catch (err: unknown) {
            setSuccess(false);
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-[var(--gov-blue)] h-1.5 w-full" />

                    {/* Header */}
                    <div className="mb-8 text-center pt-2">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
                            <UserPlus className="h-7 w-7 text-[var(--gov-blue)]" />
                        </div>
                        <h1 className="text-2xl font-black text-[var(--gov-blue)] tracking-tight">Create Account</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">Join GOV-VAULT — Unified Family Welfare</p>
                    </div>

                    {success ? (
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <CheckCircle className="h-10 w-10 text-emerald-500" />
                            <p className="font-bold text-emerald-600">Account created! Signing you in…</p>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="email" required value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full rounded-md border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[var(--gov-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--gov-blue)] transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                                    <input
                                        type={showPw ? 'text' : 'password'} required value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Create a strong password"
                                        className="w-full rounded-md border border-slate-300 bg-slate-50 py-3 pl-10 pr-11 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[var(--gov-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--gov-blue)] transition-all shadow-sm"
                                    />
                                    <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                    </button>
                                </div>

                                {/* Strength bar */}
                                {password.length > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                                    style={{ backgroundColor: i <= strength.score ? strength.color : '#e2e8f0' }} />
                                            ))}
                                        </div>
                                        <p className="text-xs font-semibold" style={{ color: strength.color }}>
                                            {strength.label} password
                                        </p>
                                    </div>
                                )}

                                {/* Requirements checklist */}
                                {password.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {REQUIREMENTS.map(req => (
                                            <li key={req.label} className="flex items-center gap-2 text-xs font-medium">
                                                <span className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${req.test(password) ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                                    {req.test(password) && <CheckCircle className="h-3 w-3 text-white" />}
                                                </span>
                                                <span className={req.test(password) ? 'text-emerald-600' : 'text-slate-400'}>{req.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                                    <input
                                        type={showConfirm ? 'text' : 'password'} required value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="Repeat your password"
                                        className={`w-full rounded-md border bg-slate-50 py-3 pl-10 pr-11 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all shadow-sm ${
                                            confirm.length > 0
                                                ? password === confirm
                                                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-400'
                                                    : 'border-red-300 focus:border-red-400 focus:ring-red-300'
                                                : 'border-slate-300 focus:border-[var(--gov-blue)] focus:ring-[var(--gov-blue)]'
                                        }`}
                                    />
                                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                    </button>
                                </div>
                                {confirm.length > 0 && password !== confirm && (
                                    <p className="mt-1 text-xs font-medium text-red-500">Passwords do not match</p>
                                )}
                                {confirm.length > 0 && password === confirm && (
                                    <p className="mt-1 text-xs font-medium text-emerald-500 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Passwords match</p>
                                )}
                            </div>

                            {error && (
                                <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" /> {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !allRequirementsMet || password !== confirm}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--gov-blue)] py-3.5 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading
                                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating account…</>
                                    : <><ShieldCheck className="h-5 w-5" /> Create Secure Account</>
                                }
                            </button>
                        </form>
                    )}

                    <p className="mt-8 text-center text-sm font-medium text-slate-500">
                        Already have an account?{' '}
                        <Link href="/login" className="font-bold text-[var(--gov-blue)] hover:underline">Sign in securely</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
