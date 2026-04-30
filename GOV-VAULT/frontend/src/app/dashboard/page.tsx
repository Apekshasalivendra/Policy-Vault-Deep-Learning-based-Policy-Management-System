'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Users, FileText, Sparkles, CheckCircle, Clock, XCircle,
    ChevronRight, PlusCircle, Loader2, ShieldCheck, Hash, Shield, AlertTriangle
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { familyApi, claimApi } from '@/lib/api';

interface FamilyMember {
    id: string; name: string; phone: string; age: number;
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
    member: { id: string; name: string; age: number; occupation: string };
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
            style={{ background: c.bg, color: c.color }}>
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
        <div className="card-elevated overflow-hidden">
            <div style={{ height: 3, background: 'var(--gov-blue)' }} />
            <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{ background: '#e8f0f8', color: 'var(--gov-blue)' }}>
                            {icon}
                        </div>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
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
        <div className="flex flex-col items-center gap-4 py-10 text-center rounded-lg"
            style={{ background: 'var(--bg-subtle)', border: '1.5px dashed var(--border)' }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                <AlertTriangle size={22} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            {action}
        </div>
    );
}

function InfoCell({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {label}
            </p>
            <div className={`font-bold text-base ${mono ? 'font-mono tracking-wide' : ''}`}
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
        <div style={{ background: 'var(--bg-page)', minHeight: 'calc(100vh - 68px)' }}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between pb-4"
                    style={{ borderBottom: '1.5px solid var(--border)' }}>
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: 'var(--gov-blue)' }}>My Dashboard</h1>
                        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Family registration, welfare claims & policy overview
                        </p>
                    </div>
                    {!familyLoading && !family && (
                        <Link href="/apply" className="btn-primary">
                            <PlusCircle size={16} /> Register Family
                        </Link>
                    )}
                </div>

                {/* ── FAMILY OVERVIEW ── */}
                <SectionCard icon={<Users size={18} />} title="Family Overview">
                    {familyLoading ? (
                        <div className="flex items-center gap-2 py-6" style={{ color: 'var(--text-muted)' }}>
                            <Loader2 size={18} className="animate-spin" />
                            <span className="text-sm font-medium">Loading family data…</span>
                        </div>
                    ) : familyError || !family ? (
                        <EmptyCard
                            message={familyError || 'You have not registered a family yet.'}
                            action={
                                <Link href="/apply" className="btn-primary text-sm">
                                    <PlusCircle size={15} /> Register Your Family
                                </Link>
                            }
                        />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <InfoCell label="Temporary Family ID" value={family.temporaryFamilyId} mono />
                            <InfoCell label="Approval Status" value={<StatusBadge status={family.status} />} />
                            <InfoCell label="Members Registered" value={family.memberCount} />
                            <InfoCell label="Registered On" value={
                                new Date(family.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            } />
                        </div>
                    )}
                </SectionCard>

                {/* ── PENDING STATE ── */}
                {!familyLoading && family && !isApproved && (
                    <div className="rounded-xl p-6 flex items-start gap-4"
                        style={{
                            background: family.status === 'REJECTED' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                            border: `1.5px solid ${family.status === 'REJECTED' ? '#fca5a5' : '#fcd34d'}`
                        }}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
                            style={{
                                background: family.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                color: family.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)'
                            }}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base mb-1"
                                style={{ color: family.status === 'REJECTED' ? 'var(--danger)' : '#92400e' }}>
                                {family.status === 'REJECTED' ? 'Registration Rejected' : 'Registration Under Review'}
                            </h3>
                            <p className="text-sm font-medium"
                                style={{ color: family.status === 'REJECTED' ? '#991b1b' : '#92400e' }}>
                                {family.status === 'REJECTED'
                                    ? 'Your family registration was rejected. Please contact the administrator for more information.'
                                    : 'Your registration is pending admin review. Member details, claims, and policy vault will be available once approved.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── APPROVED SECTIONS ── */}
                {isApproved && (
                    <>
                        {/* Members Table */}
                        {family && family.members.length > 0 && (
                            <SectionCard icon={<ShieldCheck size={18} />} title="Registered Members">
                                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                {['Name', 'Age', 'Occupation', 'Income Range', 'PAN', 'Aadhaar'].map(h => (
                                                    <th key={h}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {family.members.map(m => (
                                                <tr key={m.id}>
                                                    <td className="font-bold">{m.name}</td>
                                                    <td>{m.age}</td>
                                                    <td>{m.occupation}</td>
                                                    <td>{m.incomeRange}</td>
                                                    <td className="font-mono text-xs">{maskPan(m.pan)}</td>
                                                    <td>
                                                        {m.isAadhaarVerified
                                                            ? <span className="badge badge-approved"><CheckCircle size={10} /> Verified</span>
                                                            : <span style={{ color: 'var(--text-muted)' }}>—</span>
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
                            icon={<FileText size={18} />}
                            title="Active Claims"
                            action={
                                <Link href="/claim" className="btn-secondary text-sm py-2 px-4">
                                    <PlusCircle size={14} /> New Claim
                                </Link>
                            }>
                            {claimsLoading ? (
                                <div className="flex items-center gap-2 py-6" style={{ color: 'var(--text-muted)' }}>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">Loading claims…</span>
                                </div>
                            ) : claimsError ? (
                                <EmptyCard message={claimsError} />
                            ) : claims.length === 0 ? (
                                <EmptyCard
                                    message="No claims initiated yet."
                                    action={
                                        <Link href="/claim" className="btn-primary text-sm">
                                            <PlusCircle size={15} /> Apply for a Scheme
                                        </Link>
                                    }
                                />
                            ) : (
                                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                {['Member', 'Scheme ID', 'Source', 'Status', 'Date', ''].map(h => (
                                                    <th key={h}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {claims.map(c => (
                                                <tr key={c.id}>
                                                    <td className="font-bold">{c.member.name}</td>
                                                    <td className="font-mono text-xs">{c.schemeId}</td>
                                                    <td>
                                                        <span className="badge badge-info">
                                                            {c.source === 'AI_RECOMMENDED' ? '🤖 AI' : '✍️ Manual'}
                                                        </span>
                                                    </td>
                                                    <td><StatusBadge status={c.status} /></td>
                                                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td>
                                                        <Link href={`/claim/${c.id}`}
                                                            className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                                                            style={{ color: 'var(--gov-blue)' }}>
                                                            Track <ChevronRight size={12} />
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
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Policy Vault */}
                            <div className="card-elevated p-6 flex items-center justify-between"
                                style={{ borderLeft: '4px solid var(--gov-blue)' }}>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                                        style={{ background: '#e8f0f8', color: 'var(--gov-blue)' }}>
                                        <Shield size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Policy Vault</h3>
                                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                            Life insurance & pension policies
                                        </p>
                                    </div>
                                </div>
                                <Link href="/dashboard/policies" className="btn-primary text-sm py-2 px-4">
                                    Open <ChevronRight size={15} />
                                </Link>
                            </div>

                            {/* AI Schemes */}
                            <div className="card-elevated p-6 flex items-center justify-between"
                                style={{ borderLeft: '4px solid var(--gov-gold)' }}>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                                        style={{ background: '#fef9ec', color: '#b45309' }}>
                                        <Sparkles size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>AI Recommendations</h3>
                                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                            Government schemes for your family
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => router.push('/recommendations')}
                                    className="text-sm py-2 px-4 font-bold rounded-lg transition-all"
                                    style={{ background: 'var(--gov-gold)', color: 'var(--gov-blue)' }}>
                                    Discover <ChevronRight size={15} style={{ display: 'inline' }} />
                                </button>
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
