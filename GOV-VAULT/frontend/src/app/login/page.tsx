'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const { login, role } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            // Redirect based on role
            const token = localStorage.getItem('govvault_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                router.push(payload.role === 'ADMIN' ? '/admin' : '/dashboard');
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || 'Invalid credentials';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 relative">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-lg relative overflow-hidden">
                    {/* Header */}
                    <div className="absolute top-0 left-0 bg-[var(--gov-blue)] w-full h-1.5" />
                    
                    <div className="mb-8 text-center pt-2">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
                            <Shield className="h-8 w-8 text-[var(--gov-blue)]" />
                        </div>
                        <h1 className="text-3xl font-black text-[var(--gov-blue)] tracking-tight">Citizen Portal</h1>
                        <p className="mt-2 text-sm font-medium text-slate-500">Sign in to GOV-VAULT secure framework</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Email Address</label>
                            <div className="relative border border-slate-300 rounded-md bg-slate-50 shadow-sm overflow-hidden focus-within:border-[var(--gov-blue)] focus-within:ring-1 focus-within:ring-[var(--gov-blue)] transition-all">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-transparent py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Secure Password</label>
                            <div className="relative border border-slate-300 rounded-md bg-slate-50 shadow-sm overflow-hidden focus-within:border-[var(--gov-blue)] focus-within:ring-1 focus-within:ring-[var(--gov-blue)] transition-all">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-sm flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--gov-blue)] py-3.5 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-60 transition-all"
                        >
                            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                            {loading ? 'Authenticating…' : 'Secure Sign In'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm font-medium text-slate-500">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="font-bold text-[var(--gov-blue)] hover:underline">
                            Register your family
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
