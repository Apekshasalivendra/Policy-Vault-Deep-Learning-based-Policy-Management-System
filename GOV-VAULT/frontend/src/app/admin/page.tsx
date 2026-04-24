'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck, Users, FileCheck, BarChart3, ScrollText,
    CheckCircle, XCircle, Clock, UserCheck, Loader2, AlertCircle,
    TrendingUp, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminApi } from '@/lib/api';

interface DashboardMetrics {
    totalFamilies: number;
    pendingFamilies: number;
    approvedFamilies: number;
    rejectedFamilies: number;
    totalMembers: number;
    familiesLast7Days: number;
}

function MetricCard({
    label, value, icon, color, delay,
}: {
    label: string; value: number | string; icon: React.ReactNode;
    color: string; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`rounded-xl border p-6 flex items-center gap-5 shadow-sm bg-white ${color.replace('bg-', 'border-').replace('/10', '-200')}`}
        >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
            </div>
        </motion.div>
    );
}

const quickLinks = [
    {
        href: '/admin/families',
        icon: <Users className="h-6 w-6 text-amber-600" />,
        label: 'Family Approvals',
        desc: 'Review and approve pending registrations',
        color: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    },
    {
        href: '/admin/claims',
        icon: <FileCheck className="h-6 w-6 text-cyan-600" />,
        label: 'Claim Approvals',
        desc: 'Approve or reject welfare claims',
        color: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
    },
    {
        href: '/admin/death-reports',
        icon: <ShieldCheck className="h-6 w-6 text-orange-600" />,
        label: 'Death Reports',
        desc: 'Verify reported fatalities',
        color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    },
    {
        href: '/admin/analytics',
        icon: <BarChart3 className="h-6 w-6 text-violet-600" />,
        label: 'AI Analytics',
        desc: 'Recommendation conversion metrics',
        color: 'bg-violet-50 hover:bg-violet-100 border-violet-200',
    },
    {
        href: '/admin/audit',
        icon: <ScrollText className="h-6 w-6 text-rose-600" />,
        label: 'Audit Log',
        desc: 'Governance action trail',
        color: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
    },
];

function AdminContent() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        adminApi.getDashboard()
            .then((r) => setMetrics(r.data as DashboardMetrics))
            .catch(() => setError('Failed to load dashboard metrics.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 flex items-center gap-4 border-b border-slate-200 pb-6"
            >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 shadow-sm">
                    <ShieldCheck className="h-7 w-7 text-rose-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">GOV-VAULT governance control panel</p>
                </div>
            </motion.div>

            {/* Metrics Grid */}
            {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-[var(--gov-blue)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-bold">Loading metrics…</span>
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 shadow-sm mb-10">
                    <AlertCircle className="h-5 w-5 shrink-0" /> {error}
                </div>
            ) : metrics ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
                    <MetricCard label="Total Families" value={metrics.totalFamilies} icon={<Users className="h-6 w-6 text-slate-600" />} color="bg-slate-100" delay={0} />
                    <MetricCard label="Pending Review" value={metrics.pendingFamilies} icon={<Clock className="h-6 w-6 text-amber-600" />} color="bg-amber-100" delay={0.05} />
                    <MetricCard label="Approved" value={metrics.approvedFamilies} icon={<CheckCircle className="h-6 w-6 text-emerald-600" />} color="bg-emerald-100" delay={0.1} />
                    <MetricCard label="Rejected" value={metrics.rejectedFamilies} icon={<XCircle className="h-6 w-6 text-red-600" />} color="bg-red-100" delay={0.15} />
                    <MetricCard label="Total Members" value={metrics.totalMembers} icon={<UserCheck className="h-6 w-6 text-indigo-600" />} color="bg-indigo-100" delay={0.2} />
                    <MetricCard label="New (Last 7 Days)" value={metrics.familiesLast7Days} icon={<TrendingUp className="h-6 w-6 text-violet-600" />} color="bg-violet-100" delay={0.25} />
                </div>
            ) : null}

            {/* Quick Links */}
            <div>
                <p className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">Quick Actions</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {quickLinks.map((link, i) => (
                        <motion.div
                            key={link.href}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.07 }}
                        >
                            <Link
                                href={link.href}
                                className={`group flex flex-col gap-4 rounded-xl border p-6 transition-all shadow-sm ${link.color}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100">
                                        {link.icon}
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 text-base">{link.label}</p>
                                    <p className="text-sm font-medium text-slate-600 mt-1">{link.desc}</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminContent />
        </ProtectedRoute>
    );
}
