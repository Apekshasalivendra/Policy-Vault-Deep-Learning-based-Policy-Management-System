'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { entitlementApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, User, ShieldAlert, CheckCircle, XCircle,
    ArrowLeft, Loader2, Clock, Send, CreditCard
} from 'lucide-react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TimelineEvent {
    id: string;
    status: string;
    sequence: number;
    note: string;
    updatedAt: string;
}

interface ClaimDocument {
    id: string;
    documentType: string;
    filePath: string;
    uploadedAt: string;
}

interface AdminClaimDetails {
    id: string;
    memberId: string;
    claimantName: string;
    claimType: string;
    status: string;
    preVerifyResult: string | null;
    isClosed: boolean;
    createdAt: string;
    updatedAt: string;
    policy: {
        policyType: string;
        issuingAuthority: string;
    };
    documents: ClaimDocument[];
    timeline: TimelineEvent[];
}

// ── Component ─────────────────────────────────────────────────────────────────
function AdminClaimDetailsContent({ claimId }: { claimId: string }) {
    const [claim, setClaim] = useState<AdminClaimDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [note, setNote] = useState('');

    const fetchClaim = async () => {
        try {
            const res = await entitlementApi.adminGetClaimById(claimId);
            // Default sort timeline descending
            res.data.timeline.sort((a: any, b: any) => b.sequence - a.sequence);
            setClaim(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load claim details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaim();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimId]);

    // ── Action Handlers ───────────────────────────────────────────────────────
    const handleAction = async (actionFn: (id: string) => Promise<any>, actionName: string) => {
        setActionLoading(true);
        try {
            await actionFn(claimId); // Admin notes are hardcoded backend side right now or we could pass it if we extended the API hook
            await fetchClaim();
            setNote('');
        } catch (err: any) {
            alert(err.response?.data?.error || `Failed to ${actionName} claim.`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="text-sm text-slate-400">Loading Claim Context...</p>
            </div>
        );
    }

    if (error || !claim) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
                    <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-sm font-medium text-slate-600 mb-6">{error || 'Claim not found.'}</p>
                    <Link
                        href="/admin/claims"
                        className="inline-flex py-2.5 px-5 rounded-sm bg-[var(--gov-blue)] text-sm font-bold text-white hover:brightness-110 shadow-sm transition"
                    >
                        Back to Governance Queue
                    </Link>
                </div>
            </div>
        );
    }

    const { status, isClosed, preVerifyResult } = claim;
    const isClean = preVerifyResult === 'CLEAN';

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            {/* Header Area */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/admin/claims" className="mb-4 flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[var(--gov-blue)] transition-colors w-fit">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Queue
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Review Claim</h1>
                            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 py-1 px-2.5 rounded-sm">ID: {claim.id}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600">Admin identity verification & lifecycle management.</p>
                    </div>
                    <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider border ${status === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            status === 'UNDER_ADMIN_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                        status === 'SETTLED' ? 'bg-purple-50 text-[var(--gov-blue)] border-purple-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {status.replace(/_/g, ' ')}
                            {isClosed && <span className="ml-1.5 opacity-60 border-l mb-[1px] border-current pl-1.5">CLOSED</span>}
                        </span>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ── Left Column: Verification Identity & Documents ── */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Identity Block */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-5">
                            <User className="h-4 w-4 text-[var(--gov-blue)]" /> Claimant Identity
                        </h2>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Claimant Name</p>
                                <p className="text-sm text-slate-900 font-bold">{claim.claimantName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Filing Category</p>
                                <p className="text-sm text-slate-900 font-bold">{claim.claimType.replace(/_/g, ' ')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Target Policy</p>
                                <p className="text-sm text-slate-900 font-bold">{claim.policy.policyType}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Issuing Authority</p>
                                <p className="text-sm text-slate-900 font-bold">{claim.policy.issuingAuthority}</p>
                            </div>
                        </div>

                        {/* Pre-Verify Trust Score Indicator */}
                        <div className={`mt-6 p-4 rounded-xl border shadow-sm ${isClean ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex items-center gap-3">
                                {isClean ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 text-red-500" />}
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Engine Pre-Verification Score</p>
                                    <p className={`text-xs font-medium mt-0.5 ${isClean ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {isClean ? 'CLEAN: Automated Identity Match Confirmed' : 'FLAGGED: Manual Review Recommended'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents Block */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-5">
                            <FileText className="h-4 w-4 text-[var(--gov-blue)]" /> Uploaded Evidence
                        </h2>
                        {claim.documents.length === 0 ? (
                            <p className="text-sm font-medium text-slate-500 italic">No documents attached.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {claim.documents.map(doc => (
                                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
                                        <div className="bg-indigo-100 border border-indigo-200 p-2 rounded-md shrink-0">
                                            <FileText className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold text-slate-900 truncate">{doc.documentType.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] font-medium text-slate-500 mt-0.5">{new Date(doc.uploadedAt).toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Column: Timeline & Actions ── */}
                <div className="space-y-6">
                    {/* State Mutators (Admin Tools) */}
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--gov-blue)]" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-5 mt-1">
                            <ShieldAlert className="h-4 w-4 text-indigo-600" /> Governance Actions
                        </h2>

                        {isClosed ? (
                            <div className="text-center p-4 bg-white shadow-sm rounded-xl border border-slate-200">
                                <p className="text-sm font-bold text-slate-900">Terminal State Reached</p>
                                <p className="text-xs font-medium text-slate-600 mt-1">This claim is permanently frozen.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {status === 'SUBMITTED' && (
                                        <motion.button
                                            key="review"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onClick={() => handleAction(entitlementApi.adminReview, 'Review')}
                                            disabled={actionLoading}
                                            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-sm bg-[var(--gov-blue)] text-sm font-bold text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            Pull to "Under Review"
                                        </motion.button>
                                    )}

                                    {status === 'UNDER_ADMIN_REVIEW' && (
                                        <motion.div key="review-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleAction(entitlementApi.adminReject, 'Reject')}
                                                disabled={actionLoading}
                                                className="w-full flex justify-center items-center gap-2 py-2.5 px-3 rounded-sm bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 text-sm font-bold text-red-600 transition-all disabled:opacity-50 shadow-sm"
                                            >
                                                <XCircle className="h-4 w-4" /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(entitlementApi.adminApprove, 'Approve')}
                                                disabled={actionLoading}
                                                className="w-full flex justify-center items-center gap-2 py-2.5 px-3 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50"
                                            >
                                                <CheckCircle className="h-4 w-4" /> Approve
                                            </button>
                                        </motion.div>
                                    )}

                                    {status === 'APPROVED' && (
                                        <motion.button
                                            key="settle"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onClick={() => handleAction(entitlementApi.adminSettle, 'Settle')}
                                            disabled={actionLoading}
                                            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-sm bg-[var(--gov-gold)] hover:brightness-110 text-sm font-bold text-[var(--gov-blue)] shadow-sm transition-all disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                            Issue Settlement
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                                <p className="text-[10px] font-medium text-slate-500 text-center mt-3">State transitions are cryptographically appended to the timeline and are immutable once triggered.</p>
                            </div>
                        )}
                    </div>

                    {/* Timeline Feed */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative mt-6">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-5">
                            <Clock className="h-4 w-4 text-slate-400" /> Audit Timeline
                        </h2>

                        <div className="relative border-l border-slate-200 ml-3 space-y-5">
                            {claim.timeline.map((event) => (
                                <div key={event.id} className="relative pl-5">
                                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-300 ring-4 ring-white" />
                                    <p className="text-xs font-bold text-slate-900 mb-0.5">{event.status.replace(/_/g, ' ')}</p>
                                    <p className="text-[10px] font-medium text-slate-500 mb-1.5 font-mono">
                                        Sequence {event.sequence} • {new Date(event.updatedAt).toLocaleString('en-IN')}
                                    </p>
                                    {event.note && (
                                        <p className="text-[11px] font-medium text-slate-600 bg-slate-50 rounded-md p-2 border border-slate-100 inline-block">
                                            {event.note}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { use } from 'react';

export default function AdminClaimPage({ params }: { params: Promise<{ claimId: string }> }) {
    const resolvedParams = use(params);

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminClaimDetailsContent claimId={resolvedParams.claimId} />
        </ProtectedRoute>
    );
}
