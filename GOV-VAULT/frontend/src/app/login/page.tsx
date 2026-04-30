'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const { login, isAuthenticated, role, isLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If already authenticated, redirect away from login page immediately
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace(role === 'ADMIN' ? '/admin' : '/dashboard');
        }
    }, [isAuthenticated, isLoading, role, router]);

    // Show loading while checking session
    if (isLoading || isAuthenticated) {
        return (
            <div style={{ background: 'var(--bg-page)', minHeight: 'calc(100vh - 68px)' }}
                className="flex items-center justify-center">
                <Loader2 size={28} style={{ color: 'var(--gov-blue)' }} className="animate-spin" />
            </div>
        );
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            const token = localStorage.getItem('govvault_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                router.push(payload.role === 'ADMIN' ? '/admin' : '/dashboard');
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || 'Invalid email or password.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'var(--bg-page)', minHeight: 'calc(100vh - 68px)' }}
            className="flex items-center justify-center px-4 py-12">

            <div style={{ width: '100%', maxWidth: 440 }}>

                {/* Card */}
                <div className="card-elevated overflow-hidden">
                    {/* Top accent */}
                    <div style={{ height: 4, background: 'var(--gov-blue)', width: '100%' }} />

                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                                style={{ background: '#e8f0f8' }}>
                                <Shield size={26} style={{ color: 'var(--gov-blue)' }} />
                            </div>
                            <h1 className="text-2xl font-black" style={{ color: 'var(--gov-blue)' }}>
                                Citizen Portal
                            </h1>
                            <p className="mt-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                Sign in to GOV-VAULT Secure Framework
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold mb-1.5"
                                    style={{ color: 'var(--text-secondary)' }}>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                        style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        type="email" required value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="form-input"
                                        style={{ paddingLeft: 40 }}
                                    />
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
                                    <input
                                        type={showPw ? 'text' : 'password'} required value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="form-input"
                                        style={{ paddingLeft: 40, paddingRight: 44 }}
                                    />
                                    <button type="button" tabIndex={-1}
                                        onClick={() => setShowPw(v => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                                        style={{ color: 'var(--text-muted)' }}>
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="alert alert-error">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="btn-primary w-full justify-center py-3 text-base">
                                {loading
                                    ? <><Loader2 size={18} className="animate-spin" /> Authenticating…</>
                                    : 'Sign In Securely'
                                }
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="section-divider mt-7 mb-5" />

                        <p className="text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            Don&apos;t have an account?{' '}
                            <Link href="/register"
                                className="font-bold hover:underline"
                                style={{ color: 'var(--gov-blue)' }}>
                                Register your family
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Security note */}
                <p className="mt-4 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Protected by AES-256 encryption. Your data is secure.
                </p>
            </div>
        </div>
    );
}
