'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            // 1. Register
            await authApi.register(email, password);
            setSuccess(true);

            // 2. Auto-login immediately after registration
            await login(email, password);

            // 3. New users always go to /dashboard (they won't be ADMIN)
            router.push('/dashboard');
        } catch (err: unknown) {
            setSuccess(false);
            const msg = (err as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || 'Registration failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-[var(--gov-blue)] h-1.5 w-full"/>
                    <div className="mb-8 text-center pt-2">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
                            <UserPlus className="h-7 w-7 text-[var(--gov-blue)]" />
                        </div>
                        <h1 className="text-2xl font-black text-[var(--gov-blue)] tracking-tight">Create Account</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">Join GOV-VAULT to manage your welfare</p>
                    </div>

                    {success ? (
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <CheckCircle className="h-10 w-10 text-emerald-500" />
                            <p className="font-bold text-emerald-600">Account created! Signing you in…</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        id="register-email"
                                        type="email" required value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full rounded-md border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[var(--gov-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--gov-blue)] transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        id="register-password"
                                        type="password" required value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full rounded-md border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[var(--gov-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--gov-blue)] transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        id="register-confirm"
                                        type="password" required value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="Repeat password"
                                        className="w-full rounded-md border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[var(--gov-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--gov-blue)] transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
                                    {error}
                                </p>
                            )}

                            <button
                                id="register-submit"
                                type="submit" disabled={loading}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--gov-blue)] py-3.5 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-60 transition-all"
                            >
                                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                                {loading ? 'Creating account…' : 'Secure Registration'}
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
