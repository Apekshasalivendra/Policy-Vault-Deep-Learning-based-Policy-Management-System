'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Users, FileText, Sparkles, AlertCircle, CheckCircle, Clock, XCircle,
    ChevronRight, PlusCircle, Loader2, ShieldCheck, Hash, Shield
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { familyApi, claimApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FamilyMember {
    id: string;
    name: string;
    phone: string;
    age: number;
    occupation: string;
    incomeRange: string;
    pan: string | null;
    isAadhaarVerified: boolean;
}

interface Family {
    id: string;
    temporaryFamilyId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    memberCount: number;
    members: FamilyMember[];
}

interface Claim {
    id: string;
    schemeId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    source: 'AI_RECOMMENDED' | 'MANUAL';
    createdAt: string;
    member: { id: string; name: string; age: number; occupation: string };
    family: { id: string; temporaryFamilyId: string; status: string };
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        PENDING: { color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
        APPROVED: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Approved' },
        REJECTED: { color: 'text-red-700 bg-red-50 border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
    };
    const cfg = map[status] ?? map['PENDING'];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.color}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded-sm bg-slate-200 ${className}`} />;
}

// ── Section Card ──────────────────────────────────────────────────────────────
function Section({
    icon, title, children, action,
}: {
    icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden relative"
        >
            <div className="absolute top-0 left-0 bg-[var(--gov-blue)] w-1 h-full" />
            <div className="mb-6 flex items-center justify-between pl-2">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-blue-50 text-[var(--gov-blue)] border border-blue-100">
                        {icon}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
                </div>
                {action}
            </div>
            <div className="pl-2">
                {children}
            </div>
        </motion.section>
    );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center rounded-sm border border-dashed border-slate-200 bg-slate-50">
            <div className="rounded-full bg-slate-100 p-4 shadow-sm border border-slate-200">
                <AlertCircle className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">{message}</p>
            {action}
        </div>
    );
}

// ── Masked PAN ────────────────────────────────────────────────────────────────
function maskPan(pan: string | null): string {
    if (!pan || pan.length < 4) return '—';
    return '••••••' + pan.slice(-4);
}

// ── Dashboard Content ─────────────────────────────────────────────────────────
function DashboardContent() {
    const router = useRouter();
    const [family, setFamily] = useState<Family | null>(null);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [familyLoading, setFL] = useState(true);
    const [claimsLoading, setCL] = useState(true);
    const [familyError, setFE] = useState('');
    const [claimsError, setCE] = useState('');

    useEffect(() => {
        familyApi.getMyFamily()
            .then((r) => {
                const payload = r.data as { family: Family };
                setFamily(payload.family ?? null);
            })
            .catch((err) => {
                const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                setFE(msg || 'Could not load family data.');
            })
            .finally(() => setFL(false));

        claimApi.getMyClaims()
            .then((r) => {
                const payload = r.data as { count: number; claims: Claim[] };
                setClaims(payload.claims ?? []);
            })
            .catch(() => setCE('Could not load claims.'))
            .finally(() => setCL(false));

    }, []);

    const isApproved = family?.status === 'APPROVED';

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-b border-slate-200 pb-5">
                <h1 className="text-3xl font-extrabold text-[var(--gov-blue)] tracking-tight">My Dashboard</h1>
                <p className="mt-1 text-sm font-medium text-slate-500">Overview of your family registration, members, and claims.</p>
            </motion.div>

            {/* ── FAMILY OVERVIEW ─────────────────────────────────────────────────── */}
            <Section icon={<Users className="h-5 w-5" />} title="Family Overview">
                {familyLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-64" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                ) : familyError || !family ? (
                    <EmptyState
                        message={familyError || 'You have not registered a family yet.'}
                        action={
                            <Link
                                href="/apply"
                                className="flex items-center gap-2 rounded-sm bg-[var(--gov-blue)] px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all shadow-sm"
                            >
                                <PlusCircle className="h-4 w-4" /> Register Your Family
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Family ID */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <Hash className="h-3.5 w-3.5" /> Temporary Family ID
                            </div>
                            <p className="font-mono text-xl font-bold text-[var(--gov-blue)] tracking-wider">
                                {family.temporaryFamilyId}
                            </p>
                        </div>

                        {/* Status */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Approval Status</p>
                            <StatusBadge status={family.status} />
                            {family.status === 'PENDING' && (
                                <p className="mt-2 text-xs font-medium text-slate-600">Waiting for admin review</p>
                            )}
                        </div>

                        {/* Members */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
                            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Members</p>
                            <p className="text-3xl font-black text-[var(--gov-blue)]">{family.memberCount}</p>
                            <p className="text-xs font-medium text-slate-500">Registered</p>
                        </div>

                        {/* Registered on */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Registered On</p>
                            <p className="text-base font-bold text-slate-900">
                                {new Date(family.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                )}
            </Section>

            {isApproved ? (
                <>
            {/* ── MEMBERS TABLE ────────────────────────────────────────────────────── */}
            {family && (
                <Section icon={<ShieldCheck className="h-5 w-5" />} title="Registered Members">
                    {family.members.length === 0 ? (
                        <EmptyState message="No members found." />
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                        {['Name', 'Age', 'Occupation', 'Income Range', 'PAN', 'Aadhaar'].map((h) => (
                                            <th key={h} className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {family.members.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-900">{m.name}</td>
                                            <td className="px-5 py-4 text-slate-600 font-medium">{m.age}</td>
                                            <td className="px-5 py-4 text-slate-600 font-medium">{m.occupation}</td>
                                            <td className="px-5 py-4 text-slate-600 font-medium">{m.incomeRange}</td>
                                            <td className="px-5 py-4 font-mono text-slate-500">{maskPan(m.pan)}</td>
                                            <td className="px-5 py-4">
                                                {m.isAadhaarVerified ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-sm border border-emerald-100 uppercase tracking-wide">
                                                        <CheckCircle className="h-3.5 w-3.5" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-medium text-slate-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Section>
            )}

            {/* ── ACTIVE CLAIMS SECTION ────────────────────────────────────────────── */}
            <Section
                icon={<FileText className="h-5 w-5" />}
                title="Active Claims"
                action={
                    isApproved ? (
                        <Link
                            href="/claim"
                            className="flex items-center gap-1.5 rounded-sm bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-[var(--gov-blue)] hover:bg-[var(--gov-blue)] hover:text-white transition-all"
                        >
                            <PlusCircle className="h-3.5 w-3.5" /> New Claim
                        </Link>
                    ) : undefined
                }
            >
                {claimsLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : claimsError ? (
                    <EmptyState message={claimsError} />
                ) : claims.length === 0 ? (
                    <EmptyState
                        message="No claims initiated yet."
                        action={
                            isApproved ? (
                                <Link
                                    href="/claim"
                                    className="flex items-center gap-1.5 rounded-sm bg-[var(--gov-blue)] px-4 py-2 text-sm font-bold text-white hover:brightness-110 shadow-sm transition-all"
                                >
                                    <PlusCircle className="h-4 w-4" /> Apply for a Scheme
                                </Link>
                            ) : (
                                <p className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 border border-amber-200 rounded-sm">
                                    Family must be approved before applying for claims.
                                </p>
                            )
                        }
                    />
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                    {['Member', 'Scheme ID', 'Source', 'Status', 'Date', 'Timeline'].map((h) => (
                                        <th key={h} className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {claims.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4 font-bold text-slate-900">{c.member.name}</td>
                                        <td className="px-5 py-4 font-mono text-xs font-medium text-slate-500">{c.schemeId}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${c.source === 'AI_RECOMMENDED'
                                                ? 'bg-blue-50 text-[var(--gov-blue)] border-blue-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                {c.source === 'AI_RECOMMENDED' ? '🤖 AI' : '✍️ Manual'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                                        <td className="px-5 py-4 text-slate-500 text-xs font-medium">
                                            {new Date(c.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                href={`/claim/${c.id}`}
                                                className="inline-flex items-center text-xs font-bold text-[var(--gov-blue)] hover:underline"
                                            >
                                                Track Progress <ChevronRight className="h-3 w-3 ml-0.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            {/* ── POLICY VAULT LINK ──────────────────────────────────────────────── */}
            <Section icon={<Shield className="h-5 w-5 text-indigo-700" />} title="Policy Vault">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 mt-1">
                    <div className="flex-1">
                        <p className="text-slate-600 font-medium text-sm">
                            Access your family's financial policies, report deaths, and initiate life insurance and pension claims from your private policy vault.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/policies"
                        className={`shrink-0 flex items-center gap-2 rounded-sm px-6 py-3 font-bold text-sm transition-all ${isApproved
                            ? 'bg-[var(--gov-blue)] text-white hover:brightness-110 shadow-sm'
                            : 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400'
                            }`}
                        onClick={(e) => { if (!isApproved) e.preventDefault(); }}
                    >
                        <Shield className="h-4 w-4" />
                        Open Policy Vault
                        {isApproved && <ChevronRight className="h-4 w-4" />}
                    </Link>
                </div>
            </Section>

            {/* ── RECOMMENDATIONS SECTION ──────────────────────────────────────────── */}
            <Section icon={<Sparkles className="h-5 w-5 text-amber-600" />} title="AI Scheme Recommendations">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2 mt-1">
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-50 md:hidden mx-auto">
                            <Sparkles className="h-6 w-6 text-amber-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 max-w-lg">
                            {isApproved
                                ? 'Your family profile is active. Our AI engine can now match your members with eligible government welfare schemes.'
                                : 'Get personalized government scheme recommendations once your family is approved by an administrator.'}
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/recommendations')}
                        disabled={!isApproved}
                        className={`shrink-0 flex flex-col sm:flex-row items-center gap-2 rounded-sm px-6 py-3 font-bold text-sm transition-all ${isApproved
                            ? 'bg-[var(--gov-gold)] text-[var(--gov-blue)] hover:brightness-110 shadow-sm'
                            : 'cursor-not-allowed border border-slate-200 text-slate-400 bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Discover Best Schemes
                        </div>
                    </button>
                </div>
            </Section>
            </>
            ) : family ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
                    <div className="rounded-full bg-amber-100 p-4 shadow-sm border border-amber-200">
                        <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-amber-900">Registration Under Review</h2>
                    <p className="text-sm font-medium text-amber-700 max-w-md">
                        Your family registration is currently pending admin approval. You will gain access to member details, scheme claims, and policy vault features once approved. 
                    </p>
                    {family.status === 'REJECTED' && (
                        <p className="mt-2 rounded-md bg-red-100 px-4 py-2 text-xs font-bold text-red-700">
                            Status: REJECTED. Please contact administration.
                        </p>
                    )}
                </div>
            ) : null}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute requiredRole="USER">
            <DashboardContent />
        </ProtectedRoute>
    );
}
