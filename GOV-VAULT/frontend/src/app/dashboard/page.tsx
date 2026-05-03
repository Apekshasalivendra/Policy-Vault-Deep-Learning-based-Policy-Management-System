'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Users, FileText, Sparkles, CheckCircle, Clock, XCircle,
    ChevronRight, PlusCircle, Loader2, ShieldCheck, Shield, AlertTriangle
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { familyApi, claimApi } from '@/lib/api';

interface FamilyMember {
    id: string; nameAsInAadhaar: string; phoneAsInAadhaar: string; age: number;
    occupation: string; incomeRange: string; pan: string | null;
    isAadhaarVerified: boolean;
}
interface Family {
    id: string; temporaryFamilyId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string; memberCount: number; members: FamilyMember[];
}
interface Claim {
    id: string; schemeId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    source: 'AI_RECOMMENDED' | 'MANUAL'; createdAt: string;
    member: { id: string; nameAsInAadhaar: string; age: number; occupation: string };
    family: { id: string; temporaryFamilyId: string; status: string };
}

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
        PENDING:  { bg: 'var(--warning-bg)',  color: 'var(--warning)',  icon: <Clock size={11} />,        label: 'Pending'  },
        APPROVED: { bg: 'var(--success-bg)', color: 'var(--success)', icon: <CheckCircle size={11} />,   label: 'Approved' },
        REJECTED: { bg: 'var(--danger-bg)',  color: 'var(--danger)',  icon: <XCircle size={11} />,       label: 'Rejected' },
    };
    const c = cfg[status] ?? cfg['PENDING'];
    return (
        <span className="badge"
            style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}33` }}>
            {c.icon} {c.label}
        </span>
    );
}

function maskPan(pan: string | null) {
    if (!pan || pan.length < 4) return '—';
    return '••••••' + pan.slice(-4);
}

function SectionCard({ icon, title, children, action }: {
    icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
    return (
        <div className="card-elevated overflow-hidden bg-white border-2 border-slate-100">
            <div style={{ height: 4, background: 'var(--gov-blue)' }} />
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-[var(--gov-blue)] shadow-sm">
                            {icon}
                        </div>
                        <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--gov-blue)' }}>{title}</h2>
                    </div>
                    {action}
                </div>
                {children}
            </div>
        </div>
    );
}

function EmptyCard({ message, action }: { message: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-5 py-12 text-center rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-slate-100 text-slate-300 shadow-sm">
                <AlertTriangle size={28} />
            </div>
            <p className="text-base font-bold text-slate-700 max-w-xs">{message}</p>
            {action}
        </div>
    );
}

function InfoCell({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div className="rounded-xl p-5 bg-slate-50/50 border border-slate-100">
            <p className="text-xs font-black uppercase tracking-widest mb-2 text-slate-500">
                {label}
            </p>
            <div className={`font-black text-lg ${mono ? 'font-mono tracking-tight' : ''}`}
                style={{ color: 'var(--text-primary)' }}>
                {value}
            </div>
        </div>
    );
}

function DashboardContent() {
    const router = useRouter();
    const [family, setFamily]       = useState<Family | null>(null);
    const [claims, setClaims]       = useState<Claim[]>([]);
    const [familyLoading, setFL]    = useState(true);
    const [claimsLoading, setCL]    = useState(true);
    const [familyError, setFE]      = useState('');
    const [claimsError, setCE]      = useState('');

    useEffect(() => {
        familyApi.getMyFamily()
            .then(r => setFamily((r.data as { family: Family }).family ?? null))
            .catch(err => setFE((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not load family data.'))
            .finally(() => setFL(false));

        claimApi.getMyClaims()
            .then(r => setClaims((r.data as { count: number; claims: Claim[] }).claims ?? []))
            .catch(() => setCE('Could not load claims.'))
            .finally(() => setCL(false));
    }, []);

    const isApproved = family?.status === 'APPROVED';

    return (
        <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 68px)' }}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">

                {/* Page Header */}
                <div className="flex items-center justify-between pb-6 border-b-2 border-slate-200">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--gov-blue)' }}>Citizen Dashboard</h1>
                        <p className="text-base font-bold mt-0.5 text-slate-700">
                            Unified Family Governance & Welfare Hub
                        </p>
                    </div>
                    {!familyLoading && !family && (
                        <Link href="/apply" className="btn-primary px-6 py-3.5 shadow-xl shadow-blue-100">
                            <PlusCircle size={20} /> REGISTER FAMILY
                        </Link>
                    )}
                </div>

                {/* ── FAMILY OVERVIEW ── */}
                <SectionCard icon={<Users size={22} />} title="Family Registration">
                    {familyLoading ? (
                        <div className="flex items-center gap-3 py-10 text-indigo-600">
                            <Loader2 size={24} className="animate-spin" />
                            <span className="text-base font-black uppercase tracking-widest">Synchronizing...</span>
                        </div>
                    ) : familyError || !family ? (
                        <EmptyCard
                            message={familyError || 'You have not registered a family yet. Access welfare schemes by onboarding your family members.'}
                            action={
                                <Link href="/apply" className="btn-primary text-sm px-6">
                                    <PlusCircle size={16} /> START REGISTRATION
                                </Link>
                            }
                        />
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <InfoCell label="Temporary Family ID" value={family.temporaryFamilyId} mono />
                            <InfoCell label="Approval Status" value={<StatusBadge status={family.status} />} />
                            <InfoCell label="Members Registered" value={family.memberCount} />
                            <InfoCell label="Registration Date" value={
                                new Date(family.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            } />
                        </div>
                    )}
                </SectionCard>

                {/* ── PENDING STATE ── */}
                {!familyLoading && family && !isApproved && (
                    <div className="rounded-2xl p-7 flex items-start gap-5 shadow-sm"
                        style={{
                            background: family.status === 'REJECTED' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                            border: `2px solid ${family.status === 'REJECTED' ? '#fca5a5' : '#fcd34d'}`
                        }}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0 shadow-sm"
                            style={{
                                background: 'white',
                                color: family.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)'
                            }}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-lg mb-1.5 uppercase tracking-tight"
                                style={{ color: family.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)' }}>
                                {family.status === 'REJECTED' ? 'Registration Rejected' : 'Registration Under Official Review'}
                            </h3>
                            <p className="text-base font-bold leading-relaxed"
                                style={{ color: family.status === 'REJECTED' ? '#991b1b' : '#92400e' }}>
                                {family.status === 'REJECTED'
                                    ? 'Your family registration was rejected by the administrator. Review your member details or contact support for clarification.'
                                    : 'Your application is currently being verified. AI recommendations and policy management will be unlocked upon approval.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── APPROVED SECTIONS ── */}
                {isApproved && (
                    <>
                        {/* Members Table */}
                        {family && family.members.length > 0 && (
                            <SectionCard icon={<ShieldCheck size={22} />} title="Registered Members">
                                <div className="overflow-x-auto rounded-xl border-2 border-slate-100 shadow-sm">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                {['Name', 'Age', 'Occupation', 'Income Range', 'PAN', 'Aadhaar Status'].map(h => (
                                                    <th key={h} className="bg-slate-50/80 font-black text-slate-600">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {family.members.map(m => (
                                                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="font-black text-slate-900">{m.nameAsInAadhaar}</td>
                                                    <td className="font-bold text-slate-700">{m.age}</td>
                                                    <td className="font-bold text-slate-700">{m.occupation}</td>
                                                    <td className="font-bold text-slate-700">{m.incomeRange}</td>
                                                    <td className="font-mono text-xs font-bold text-slate-500">{maskPan(m.pan)}</td>
                                                    <td>
                                                        {m.isAadhaarVerified
                                                            ? <span className="badge badge-approved py-1 px-3"><CheckCircle size={11} /> VERIFIED</span>
                                                            : <span className="text-slate-400 font-bold tracking-widest">—</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionCard>
                        )}

                        {/* Active Claims */}
                        <SectionCard
                            icon={<FileText size={22} />}
                            title="Active Welfare Claims"
                            action={
                                <Link href="/recommendations" className="btn-secondary text-sm py-2.5 px-5 font-black border-2 shadow-sm text-amber-600 border-amber-200 hover:bg-amber-50">
                                    <Sparkles size={16} className="text-amber-500" /> DISCOVER SCHEMES
                                </Link>
                            }>
                            {claimsLoading ? (
                                <div className="flex items-center gap-3 py-10 text-indigo-600">
                                    <Loader2 size={24} className="animate-spin" />
                                    <span className="text-base font-black uppercase tracking-widest">Updating Claims...</span>
                                </div>
                            ) : claimsError ? (
                                <EmptyCard message={claimsError} />
                            ) : claims.length === 0 ? (
                                <EmptyCard
                                    message="No welfare claims initiated yet. Discover matching schemes via our AI engine."
                                    action={
                                        <Link href="/recommendations" className="btn-primary text-sm px-6">
                                            <Sparkles size={16} /> DISCOVER SCHEMES
                                        </Link>
                                    }
                                />
                            ) : (
                                <div className="overflow-x-auto rounded-xl border-2 border-slate-100 shadow-sm">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                {['Member', 'Scheme ID', 'Source', 'Current Status', 'Submission Date', 'Details'].map(h => (
                                                    <th key={h} className="bg-slate-50/80 font-black text-slate-600">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {claims.map(c => (
                                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="font-black text-slate-900">{c.member.nameAsInAadhaar}</td>
                                                    <td className="font-mono text-xs font-bold text-slate-500 tracking-tighter">{c.schemeId}</td>
                                                    <td>
                                                        <span className={`badge py-1 px-2.5 ${c.source === 'AI_RECOMMENDED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                            {c.source === 'AI_RECOMMENDED' ? '🤖 AI MATCH' : '✍️ MANUAL'}
                                                        </span>
                                                    </td>
                                                    <td><StatusBadge status={c.status} /></td>
                                                    <td className="text-xs font-bold text-slate-600">
                                                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td>
                                                        <Link href={`/claim/${c.id}`}
                                                            className="inline-flex items-center gap-1 text-xs font-black hover:underline uppercase tracking-widest"
                                                            style={{ color: 'var(--gov-blue)' }}>
                                                            Track <ChevronRight size={14} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </SectionCard>

                        {/* Quick Action Cards */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Policy Vault */}
                            <div className="card-elevated p-7 flex items-center justify-between bg-white border-2 border-slate-100 sm:col-span-2 md:col-span-1"
                                style={{ borderLeft: '6px solid var(--gov-blue)' }}>
                                <div className="flex items-center gap-5">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-[var(--gov-blue)] shadow-sm">
                                        <Shield size={28} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--gov-blue)' }}>Policy Vault</h3>
                                        <p className="text-sm font-bold mt-0.5 text-slate-700">
                                            Insurance & Pension Repository
                                        </p>
                                    </div>
                                </div>
                                <Link href="/dashboard/policies" className="btn-primary px-6 py-3 shadow-xl shadow-blue-100">
                                    OPEN <ChevronRight size={18} />
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
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
