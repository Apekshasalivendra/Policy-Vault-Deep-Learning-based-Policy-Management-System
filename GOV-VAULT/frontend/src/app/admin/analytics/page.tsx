'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, ArrowLeft, Loader2, AlertCircle, Sparkles,
    FileText, TrendingUp, Activity, Zap,
} from 'lucide-react';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TopScheme {
    schemeId: string;
    schemeName: string;
    count: number;
}

interface Analytics {
    totalRecommendations: number;
    recommendationsLast7Days: number;
    topRecommendedSchemes: TopScheme[];
    recommendationToClaimConversionRate: number;
    totalAiDrivenClaims: number;
    totalManualClaims: number;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
    label, value, sub, icon, color, delay,
}: {
    label: string; value: string | number; sub?: string;
    icon: React.ReactNode; color: string; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-sm"
        >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
                {sub && <p className="text-xs font-medium text-slate-600 mt-0.5">{sub}</p>}
            </div>
        </motion.div>
    );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: TopScheme }[] }) {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl text-xs">
            <p className="font-bold text-slate-900 mb-0.5">{d.payload.schemeName || d.payload.schemeId}</p>
            <p className="font-medium text-[var(--gov-blue)]">{d.value} recommendation{d.value !== 1 ? 's' : ''}</p>
        </div>
    );
}

// ── Chart Label Formatter (short scheme ID) ────────────────────────────────────
function shortenId(id: string) {
    if (id.length <= 10) return id;
    return id.slice(0, 9) + '…';
}

// ── Main Content ───────────────────────────────────────────────────────────────
function AdminAnalyticsContent() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        adminApi.getAnalytics()
            .then((r) => setAnalytics(r.data as Analytics))
            .catch(() => setError('Failed to load analytics data.'))
            .finally(() => setLoading(false));
    }, []);

    const totalClaims = analytics
        ? analytics.totalAiDrivenClaims + analytics.totalManualClaims
        : 0;

    const aiPct = totalClaims > 0
        ? Math.round((analytics!.totalAiDrivenClaims / totalClaims) * 100)
        : 0;

    // Colour ramp for bar chart cells
    const barColors = [
        '#0B3C5D', '#11537E', '#1669A0', '#1C80C2',
        '#2C99DE', '#4FAAE3', '#73BCE8', '#96CDEE', '#B9DFF3', '#DDF0F9',
    ];

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border-b border-slate-200 pb-6">
                <Link
                    href="/admin"
                    className="mb-4 flex w-fit items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Admin Dashboard
                </Link>
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 border border-violet-200 shadow-sm">
                        <BarChart3 className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Analytics</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Recommendation engine performance and scheme intelligence
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center gap-3 py-20 text-[var(--gov-blue)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-bold">Loading analytics…</span>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 shadow-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" /> {error}
                </div>
            )}

            {/* No data empty state */}
            {!loading && !error && analytics && analytics.totalRecommendations === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 py-20 text-center rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="rounded-full bg-slate-100 p-5 shadow-sm border border-slate-200">
                        <BarChart3 className="h-8 w-8 text-slate-400 mx-auto" />
                    </div>
                    <p className="text-lg font-bold text-slate-900 mb-1">No analytics data available yet</p>
                    <p className="text-sm font-medium text-slate-500 max-w-xs">
                        Analytics will appear once users start requesting AI-powered scheme recommendations.
                    </p>
                </motion.div>
            )}

            {/* Main content */}
            {!loading && !error && analytics && analytics.totalRecommendations > 0 && (
                <>
                    {/* ── Stat Cards ── */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                        <StatCard
                            label="Total Recommendations"
                            value={analytics.totalRecommendations}
                            icon={<Sparkles className="h-5 w-5 text-indigo-600" />}
                            color="bg-indigo-50 border border-indigo-200"
                            delay={0}
                        />
                        <StatCard
                            label="Last 7 Days"
                            value={analytics.recommendationsLast7Days}
                            sub="recent AI activity"
                            icon={<Activity className="h-5 w-5 text-cyan-600" />}
                            color="bg-cyan-50 border border-cyan-200"
                            delay={0.05}
                        />
                        <StatCard
                            label="Conversion Rate"
                            value={`${analytics.recommendationToClaimConversionRate}%`}
                            sub="recommendation → claim"
                            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                            color="bg-emerald-50 border border-emerald-200"
                            delay={0.1}
                        />
                        <StatCard
                            label="AI-Driven Claims"
                            value={analytics.totalAiDrivenClaims}
                            sub="from AI recommendations"
                            icon={<Zap className="h-5 w-5 text-[var(--gov-blue)]" />}
                            color="bg-[var(--gov-blue)]/10 border border-[var(--gov-blue)]/20"
                            delay={0.15}
                        />
                        <StatCard
                            label="Manual Claims"
                            value={analytics.totalManualClaims}
                            sub="submitted without AI"
                            icon={<FileText className="h-5 w-5 text-slate-600" />}
                            color="bg-slate-50 border border-slate-200"
                            delay={0.2}
                        />
                    </div>

                    {/* ── AI vs Manual Split ── */}
                    {totalClaims > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                Claim Source Breakdown
                            </p>
                            <div className="flex items-center gap-6 mb-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <span className="inline-block h-3 w-3 rounded-full bg-[var(--gov-blue)]" />
                                    AI-Driven ({analytics.totalAiDrivenClaims})
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                    <span className="inline-block h-3 w-3 rounded-full bg-slate-300" />
                                    Manual ({analytics.totalManualClaims})
                                </div>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                                <div
                                    className="h-full rounded-full bg-[var(--gov-blue)] transition-all duration-700"
                                    style={{ width: `${aiPct}%` }}
                                />
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-600">
                                <strong className="text-slate-900">{aiPct}%</strong> of total claims are AI-driven
                            </p>
                        </motion.div>
                    )}

                    {/* ── Bar Chart — Top Recommended Schemes ── */}
                    {analytics.topRecommendedSchemes.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <p className="mb-1 text-lg font-bold text-slate-900 tracking-tight">
                                Top Recommended Schemes
                            </p>
                            <p className="mb-6 text-sm font-medium text-slate-500">
                                Recommendation count per scheme — sorted descending
                            </p>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analytics.topRecommendedSchemes}
                                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                                        barSize={28}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="schemeId"
                                            tickFormatter={shortenId}
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                            axisLine={{ stroke: '#cbd5e1' }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(2f, 4e, 7c, 0.05)' }} />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {analytics.topRecommendedSchemes.map((_, i) => (
                                                <Cell key={i} fill={barColors[i % barColors.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Top Schemes Table ── */}
                    {analytics.topRecommendedSchemes.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="mb-6 border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden"
                        >
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                        <th className="pl-6 pr-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-8">#</th>
                                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Scheme</th>
                                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Recommendations</th>
                                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {analytics.topRecommendedSchemes.map((scheme, i) => {
                                        const max = analytics.topRecommendedSchemes[0]?.count ?? 1;
                                        const pct = Math.round((scheme.count / max) * 100);
                                        return (
                                            <tr key={scheme.schemeId} className="hover:bg-slate-50 transition-colors">
                                                <td className="pl-6 pr-4 py-4 text-slate-500 font-bold text-xs">{i + 1}</td>
                                                <td className="px-4 py-4">
                                                    <p className="font-bold text-slate-900">
                                                        {scheme.schemeName || scheme.schemeId}
                                                    </p>
                                                    <p className="font-mono text-xs font-medium text-slate-500 mt-0.5">
                                                        {scheme.schemeId}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gov-blue)]/10 border border-[var(--gov-blue)]/20 px-2.5 py-1 text-xs font-bold text-[var(--gov-blue)]">
                                                        <Sparkles className="h-3 w-3" /> {scheme.count}×
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 w-48">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 overflow-hidden rounded-full bg-slate-100 border border-slate-200 h-2">
                                                            <div
                                                                className="h-full rounded-full bg-[var(--gov-blue)] transition-all"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 w-8">{pct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs font-medium text-slate-500">
                                {analytics.topRecommendedSchemes.length} unique scheme
                                {analytics.topRecommendedSchemes.length !== 1 ? 's' : ''} tracked
                            </div>
                        </motion.div>
                    )}

                    {/* ── Insight Callout ── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.42 }}
                        className="rounded-xl border border-[var(--gov-blue)]/20 bg-[var(--gov-blue)]/5 px-6 py-5 flex items-start gap-4 shadow-sm"
                    >
                        <Zap className="h-5 w-5 text-[var(--gov-blue)] mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                            The AI engine has generated{' '}
                            <span className="font-bold text-[var(--gov-blue)]">{analytics.totalRecommendations}</span>{' '}
                            scheme recommendations and converted{' '}
                            <span className="font-bold text-[var(--gov-blue)]">
                                {analytics.recommendationToClaimConversionRate}%
                            </span>{' '}
                            into active claims.{' '}
                            <span className="font-bold text-[var(--gov-blue)]">
                                {analytics.totalAiDrivenClaims}
                            </span>{' '}
                            of {totalClaims} total claims are AI-driven, demonstrating measurable AI impact on welfare access.
                        </p>
                    </motion.div>
                </>
            )}
        </div>
    );
}

export default function AdminAnalyticsPage() {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminAnalyticsContent />
        </ProtectedRoute>
    );
}
