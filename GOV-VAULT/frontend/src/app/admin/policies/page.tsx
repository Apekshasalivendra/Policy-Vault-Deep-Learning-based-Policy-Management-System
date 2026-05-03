'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Loader2, AlertCircle, CheckCircle,
    XCircle, Mail, User, Users, ChevronDown, ChevronUp,
    ArrowLeft, Clock, Percent, Shield
} from 'lucide-react';
import Link from 'next/link';

interface PolicyClaimFull {
    id: string;
    schemeId: string; // Holds the policy ID
    status: string;
    createdAt: string;
    metadata: {
        policyName: string;
        claimantName: string;
        claimantPercentage: number;
        allNominees: Array<{ id: string; name: string; relation: string; percentage: number }>;
    };
    member: {
        id: string;
        nameAsInAadhaar: string;
        age: number;
        gender: string;
        religion: string;
    };
    family: {
        id: string;
        temporaryFamilyId: string;
        createdBy?: { email: string };
    };
}

function PolicyClaimCard({ claim, onApprove, onReject, onRequestDocs, showToast }: {
    claim: PolicyClaimFull;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string) => Promise<void>;
    onRequestDocs: (id: string) => Promise<void>;
    showToast: (kind: 'success' | 'error', message: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [processing, setProcessing] = useState<'approve' | 'reject' | 'mail' | null>(null);
    const [mailSent, setMailSent] = useState(false);
    const [docs, setDocs] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [hasFetchedDocs, setHasFetchedDocs] = useState(false);

    useEffect(() => {
        if (expanded && !hasFetchedDocs && !loadingDocs) {
            setLoadingDocs(true);
            adminApi.getFamilyDocuments(`claim-${claim.id}`)
                .then(r => {
                    setDocs(r.data.documents || []);
                    setHasFetchedDocs(true);
                })
                .catch(console.error)
                .finally(() => setLoadingDocs(false));
        }
    }, [expanded, claim.id, hasFetchedDocs, loadingDocs]);

    const handleApprove = async () => {
        setProcessing('approve');
        await onApprove(claim.id);
        setProcessing(null);
    };
    const handleReject = async () => {
        setProcessing('reject');
        await onReject(claim.id);
        setProcessing(null);
    };
    const handleMail = async () => {
        setProcessing('mail');
        try {
            await onRequestDocs(claim.id);
            setMailSent(true);
            showToast('success', 'Document request email sent to user.');
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Failed to request documents.';
            showToast('error', msg);
            console.error(error);
        } finally {
            setProcessing(null);
        }
    };

    const meta = claim.metadata;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                        <Shield className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">{meta?.policyName ?? claim.schemeId}</p>
                        <p className="text-xs text-slate-500">Family ID: {claim.family.temporaryFamilyId}</p>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                    {expanded ? <><ChevronUp size={14} />Hide</> : <><ChevronDown size={14} />Details</>}
                </button>
            </div>

            {/* Summary row */}
            <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Claimant</p>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                        <User size={12} className="text-violet-500" /> {meta?.claimantName ?? claim.member.nameAsInAadhaar}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Claim Share</p>
                    <p className="text-sm font-bold text-violet-700 flex items-center gap-1">
                        <Percent size={12} /> {meta?.claimantPercentage ?? '—'}%
                    </p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Nominees</p>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                        <Users size={12} className="text-violet-500" /> {meta?.allNominees?.length ?? 0}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                        <Clock size={12} /> {new Date(claim.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Expanded details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100"
                    >
                        <div className="px-6 py-5 grid sm:grid-cols-2 gap-6">
                            {/* All Nominees */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">All Policy Nominees</p>
                                <div className="space-y-2">
                                    {(meta?.allNominees ?? []).map((n, i) => (
                                        <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${n.name === meta?.claimantName ? 'bg-violet-50 border border-violet-200' : 'bg-slate-50'}`}>
                                            <span className="font-medium text-slate-800">{n.name}</span>
                                            <span className="font-bold text-violet-700">{n.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Claimant Details */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Claimant Details</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-slate-500">Age</span><span className="font-medium">{claim.member.age}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Gender</span><span className="font-medium">{claim.member.gender}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Religion</span><span className="font-medium">{claim.member.religion}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-xs">{claim.family.createdBy?.email ?? '—'}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Documents Section */}
                        {(docs.length > 0 || loadingDocs) && (
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Uploaded Documents</p>
                                {loadingDocs ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Loader2 size={14} className="animate-spin" /> Loading documents...
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {docs.map(doc => {
                                            const apiBase = window.location.hostname === 'localhost' 
                                                ? 'http://localhost:3000' 
                                                : `${window.location.protocol}//${window.location.hostname}:3000`;
                                            const fileUrl = `${apiBase}${doc.filePath}`;
                                            return (
                                                <a 
                                                    key={doc.id} 
                                                    href={fileUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50 transition-colors"
                                                >
                                                    <FileText size={16} className="text-violet-500" />
                                                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                                                        {doc.fileName}
                                                    </span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center gap-3">
                <button
                    onClick={handleMail}
                    disabled={processing !== null || mailSent}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        mailSent
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                    }`}
                >
                    {processing === 'mail' ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    {mailSent ? 'Docs Requested ✓' : 'Request Documents'}
                </button>

                <div className="ml-auto flex gap-3">
                    <button
                        onClick={handleReject}
                        disabled={processing !== null}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-60"
                    >
                        {processing === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={processing !== null}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-60"
                    >
                        {processing === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function AdminPolicyApprovalsContent() {
    const [claims, setClaims] = useState<PolicyClaimFull[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ id: string; kind: 'success' | 'error'; message: string } | null>(null);

    const showToast = (kind: 'success' | 'error', message: string) => {
        const id = Math.random().toString();
        setToast({ id, kind, message });
        setTimeout(() => setToast(null), 3500);
    };

    const load = () => {
        setLoading(true);
        adminApi.getPendingPolicyClaims()
            .then(r => setClaims((r.data as any).claims ?? []))
            .catch(() => setError('Failed to load policy claims.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleApprove = async (id: string) => {
        await adminApi.approvePolicyClaim(id);
        setClaims(prev => prev.filter(c => c.id !== id));
    };
    const handleReject = async (id: string) => {
        await adminApi.rejectPolicyClaim(id);
        setClaims(prev => prev.filter(c => c.id !== id));
    };
    const handleRequestDocs = async (id: string) => {
        await adminApi.requestPolicyDocs(id);
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border-2 px-6 py-4 text-sm font-black shadow-2xl backdrop-blur ${
                            toast.kind === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-red-200 bg-red-50 text-red-800'
                        }`}
                    >
                        {toast.kind === 'success' ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-8 flex items-center gap-4">
                <Link href="/admin" className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={15} /> Back
                </Link>
                <div className="h-5 w-px bg-slate-300" />
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 border border-violet-200">
                    <Shield className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Policy Approvals</h1>
                    <p className="text-sm text-slate-500">Review LIC and insurance policy claim requests</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-violet-600">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span className="text-sm font-bold">Loading policy claims…</span>
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                    <AlertCircle className="h-5 w-5 shrink-0" /> {error}
                </div>
            ) : claims.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="font-bold text-slate-900 text-lg">All caught up!</p>
                    <p className="text-slate-500 text-sm">No pending policy claim requests.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    <p className="text-sm font-bold text-slate-500">{claims.length} pending claim{claims.length !== 1 ? 's' : ''}</p>
                    <AnimatePresence>
                        {claims.map(c => (
                            <PolicyClaimCard key={c.id} claim={c} onApprove={handleApprove} onReject={handleReject} onRequestDocs={handleRequestDocs} showToast={showToast} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default function AdminPoliciesPage() {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminPolicyApprovalsContent />
        </ProtectedRoute>
    );
}
