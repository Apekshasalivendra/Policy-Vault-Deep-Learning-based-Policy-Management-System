'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, Loader2, CheckCircle, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string) {
    let score = 0;
    if (pw.length >= 8)          score++;
    if (pw.length >= 12)         score++;
    if (/[A-Z]/.test(pw))        score++;
    if (/[0-9]/.test(pw))        score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
        { label: 'Weak',        color: '#dc2626' },
        { label: 'Weak',        color: '#dc2626' },
        { label: 'Fair',        color: '#d97706' },
        { label: 'Good',        color: '#ca8a04' },
        { label: 'Strong',      color: '#16a34a' },
        { label: 'Very Strong', color: '#15803d' },
    ];
    return { score, ...levels[score] };
}

const REQUIREMENTS = [
    { label: 'At least 8 characters',         test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter (A–Z)',      test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One number (0–9)',                test: (p: string) => /[0-9]/.test(p) },
    { label: 'One special character (!@#$…)',   test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm]   = useState('');
    const [showPw, setShowPw]     = useState(false);
    const [showCf, setShowCf]     = useState(false);
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState(false);
    const [loading, setLoading]   = useState(false);

    const strength = getStrength(password);
    const allMet   = REQUIREMENTS.every(r => r.test(password));
    const pwMatch  = password === confirm;

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!allMet)  { setError('Please meet all password requirements.'); return; }
        if (!pwMatch) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            await authApi.register(email, password);
            setSuccess(true);
            await login(email, password);
            router.push('/dashboard');
        } catch (err: unknown) {
            setSuccess(false);
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'var(--bg-page)', minHeight: 'calc(100vh - 68px)' }}
            className="flex items-center justify-center px-4 py-12">

            <div style={{ width: '100%', maxWidth: 460 }}>
                <div className="card-elevated overflow-hidden">
                    <div style={{ height: 4, background: 'var(--gov-blue)' }} />

                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                                style={{ background: '#e8f0f8' }}>
                                <UserPlus size={26} style={{ color: 'var(--gov-blue)' }} />
                            </div>
                            <h1 className="text-2xl font-black" style={{ color: 'var(--gov-blue)' }}>
                                Create Account
                            </h1>
                            <p className="mt-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                Join GOV-VAULT — Unified Family Welfare
                            </p>
                        </div>

                        {success ? (
                            <div className="flex flex-col items-center gap-3 py-8 text-center">
                                <CheckCircle size={44} style={{ color: '#16a34a' }} />
                                <p className="font-bold text-lg" style={{ color: '#15803d' }}>
                                    Account created! Signing you in…
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-5">

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5"
                                        style={{ color: 'var(--text-secondary)' }}>
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                            style={{ color: 'var(--text-muted)' }} />
                                        <input type="email" required value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="form-input"
                                            style={{ paddingLeft: 40 }} />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5"
                                        style={{ color: 'var(--text-secondary)' }}>
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                            style={{ color: 'var(--text-muted)' }} />
                                        <input type={showPw ? 'text' : 'password'} required value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Create a strong password"
                                            className="form-input"
                                            style={{ paddingLeft: 40, paddingRight: 44 }} />
                                        <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2"
                                            style={{ color: 'var(--text-muted)' }}>
                                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>

                                    {/* Strength bar */}
                                    {password.length > 0 && (
                                        <div className="mt-2.5 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1 flex-1">
                                                    {[1,2,3,4,5].map(i => (
                                                        <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                                                            style={{ background: i <= strength.score ? strength.color : 'var(--border)' }} />
                                                    ))}
                                                </div>
                                                <span className="text-xs font-bold" style={{ color: strength.color }}>
                                                    {strength.label}
                                                </span>
                                            </div>
                                            <ul className="space-y-1">
                                                {REQUIREMENTS.map(req => {
                                                    const ok = req.test(password);
                                                    return (
                                                        <li key={req.label} className="flex items-center gap-2 text-xs font-medium">
                                                            <span className="flex h-4 w-4 items-center justify-center rounded-full flex-shrink-0"
                                                                style={{ background: ok ? '#dcfce7' : 'var(--bg-subtle)', border: `1px solid ${ok ? '#86efac' : 'var(--border)'}` }}>
                                                                {ok && <CheckCircle size={10} style={{ color: '#16a34a' }} />}
                                                            </span>
                                                            <span style={{ color: ok ? '#15803d' : 'var(--text-muted)' }}>{req.label}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5"
                                        style={{ color: 'var(--text-secondary)' }}>
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                            style={{ color: 'var(--text-muted)' }} />
                                        <input type={showCf ? 'text' : 'password'} required value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            placeholder="Repeat your password"
                                            className="form-input"
                                            style={{
                                                paddingLeft: 40, paddingRight: 44,
                                                borderColor: confirm.length > 0
                                                    ? (pwMatch ? '#86efac' : '#fca5a5')
                                                    : undefined
                                            }} />
                                        <button type="button" tabIndex={-1} onClick={() => setShowCf(v => !v)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2"
                                            style={{ color: 'var(--text-muted)' }}>
                                            {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {confirm.length > 0 && (
                                        <p className="mt-1 text-xs font-semibold flex items-center gap-1"
                                            style={{ color: pwMatch ? '#15803d' : '#dc2626' }}>
                                            {pwMatch
                                                ? <><CheckCircle size={12} /> Passwords match</>
                                                : 'Passwords do not match'
                                            }
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <div className="alert alert-error">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                <button type="submit"
                                    disabled={loading || !allMet || !pwMatch || !confirm}
                                    className="btn-primary w-full justify-center py-3 text-base mt-2">
                                    {loading
                                        ? <><Loader2 size={18} className="animate-spin" /> Creating account…</>
                                        : <><ShieldCheck size={18} /> Create Secure Account</>
                                    }
                                </button>
                            </form>
                        )}

                        <div className="section-divider mt-7 mb-5" />
                        <p className="text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            Already have an account?{' '}
                            <Link href="/login" className="font-bold hover:underline"
                                style={{ color: 'var(--gov-blue)' }}>
                                Sign in securely
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
