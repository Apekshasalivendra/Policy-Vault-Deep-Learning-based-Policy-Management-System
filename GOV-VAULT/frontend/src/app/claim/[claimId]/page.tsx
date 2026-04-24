'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle, AlertCircle, Loader2, ArrowLeft,
    UploadCloud, ShieldCheck, Send, Info, Clock, CheckCircle2,
    XCircle, Circle, Hash, Milestone, Calendar
} from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { entitlementApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TimelineEvent {
    id: string;
    claimId: string;
    status: 'INITIATED' | 'DOCUMENTS_PENDING' | 'PRE_VERIFIED' | 'SUBMITTED' | 'UNDER_ADMIN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED';
    sequence: number;
    note: string;
    updatedAt: string;
}

type PageState =
    | { kind: 'loading' }
    | { kind: 'error'; code?: number; message: string }
    | { kind: 'ready'; timeline: TimelineEvent[]; currentStatus: string; latestEvent: TimelineEvent; claimId: string };

const STAGE_ORDER = [
    'INITIATED',
    'DOCUMENTS_PENDING',
    'PRE_VERIFIED',
    'SUBMITTED',
    'UNDER_ADMIN_REVIEW',
    'APPROVED',
    'SETTLED'
];

function getStageMeta(stage: string) {
    const meta: Record<string, { label: string; desc: string }> = {
        'INITIATED': { label: 'Claim Initiated', desc: 'Application has been started' },
        'DOCUMENTS_PENDING': { label: 'Documents Uploaded', desc: 'Awaiting supporting documents processing' },
        'PRE_VERIFIED': { label: 'Pre-Verified', desc: 'Basic checks completed successfully' },
        'SUBMITTED': { label: 'Submitted to Dept', desc: 'Sent to the relevant department' },
        'UNDER_ADMIN_REVIEW': { label: 'Under Review', desc: 'Admin is reviewing application' },
        'APPROVED': { label: 'Approved', desc: 'Claim officially approved' },
        'REJECTED': { label: 'Rejected', desc: 'Application was rejected' },
        'SETTLED': { label: 'Settled', desc: 'Funds/Benefits disbursed' },
    };
    return meta[stage] || { label: stage, desc: '' };
}

// ── Component ─────────────────────────────────────────────────────────────────
function ClaimDetailsContent({ claimId }: { claimId: string }) {
    const router = useRouter();
    const [pageState, setPageState] = useState<PageState>({ kind: 'loading' });
    const [uploading, setUploading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDocType, setSelectedDocType] = useState('DEATH_CERTIFICATE');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const loadTimeline = async () => {
        try {
            const res = await entitlementApi.getTimeline(claimId);
            const timeline: TimelineEvent[] = res.data;

            if (!timeline || timeline.length === 0) {
                setPageState({ kind: 'error', message: 'No timeline events found for this claim.' });
                return;
            }

            const sorted = [...timeline].sort((a, b) => b.sequence - a.sequence);
            const latestEvent = sorted[0];

            setPageState({
                kind: 'ready',
                timeline: sorted,
                currentStatus: latestEvent.status,
                latestEvent,
                claimId
            });
        } catch (err: any) {
            const status = err.response?.status;
            let message = 'Failed to load claim details.';
            if (status === 403) message = 'Unauthorized access to this claim.';
            else if (err.response?.data?.error) message = err.response.data.error;

            setPageState({ kind: 'error', code: status, message });
        }
    };

    useEffect(() => {
        loadTimeline();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimId]);

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('claimId', claimId);
            formData.append('documentType', selectedDocType);
            formData.append('file', selectedFile);

            await entitlementApi.uploadDocument(formData);

            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            await loadTimeline();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to upload document.');
        } finally {
            setUploading(false);
        }
    };

    const handlePreVerify = async () => {
        setVerifying(true);
        try {
            await entitlementApi.preVerify(claimId);
            await loadTimeline();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Pre-verification failed.');
            await loadTimeline();
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await entitlementApi.submitClaim(claimId);
            await loadTimeline();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to submit claim.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render Helpers ────────────────────────────────────────────────────────

    if (pageState.kind === 'loading') {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-[var(--gov-blue)]">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p className="font-semibold tracking-wide">Fetching Claim Details...</p>
                </div>
            </div>
        );
    }

    if (pageState.kind === 'error') {
        return (
            <div className="mx-auto max-w-3xl px-4 py-12">
                <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--gov-blue)] transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-red-200 bg-red-50 py-16 text-center shadow-sm">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <h2 className="text-xl font-bold text-red-700">Access Denied</h2>
                    <p className="text-sm font-medium text-red-600">{pageState.message}</p>
                </div>
            </div>
        );
    }

    const { currentStatus, latestEvent, timeline } = pageState;
    const isClean = latestEvent.note.includes('CLEAN');
    const isFlagged = latestEvent.note.includes('FLAGGED');
    const isRejected = currentStatus === 'REJECTED';

    const timelineStages = isRejected 
        ? STAGE_ORDER.filter(s => s !== 'APPROVED' && s !== 'SETTLED').concat(['REJECTED']) 
        : STAGE_ORDER;

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-b border-slate-200 pb-5">
                <Link href="/dashboard" className="mb-4 flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[var(--gov-blue)] transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 shadow-sm">
                            <FileText className="h-7 w-7 text-[var(--gov-blue)]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-[var(--gov-blue)] tracking-tight">Claim Dashboard</h1>
                            <p className="font-mono text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">REF ID: {claimId.split('-')[0]}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Area: Main Action Container */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="popLayout">
                        {/* STATE 1: INITIATED */}
                        {currentStatus === 'INITIATED' && (
                            <motion.div
                                key="initiated"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--gov-blue)]" />
                                <div className="mb-6 pl-2">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                                        <UploadCloud className="h-5 w-5 text-blue-600" />
                                        Step 1: Upload Documents
                                    </h2>
                                    <p className="text-sm font-medium text-slate-600">
                                        Please provide the required supporting documents to proceed with your claim verification.
                                    </p>
                                </div>

                                <div className="space-y-5 mb-8 pl-2">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Document Type</label>
                                        <select
                                            value={selectedDocType}
                                            onChange={(e) => setSelectedDocType(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-[var(--gov-blue)] focus:ring-1 focus:ring-[var(--gov-blue)] outline-none transition-all shadow-sm"
                                        >
                                            <option value="DEATH_CERTIFICATE">Death Certificate</option>
                                            <option value="IDENTITY_PROOF">Identity Proof (Aadhaar/PAN)</option>
                                            <option value="BANK_PASSBOOK">Bank Passbook / Cancelled Cheque</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select File</label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="block w-full text-sm font-medium text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[var(--gov-blue)] hover:file:bg-blue-100 transition-all cursor-pointer border border-slate-300 rounded-md bg-white shadow-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || uploading}
                                    className="w-full flex items-center justify-center gap-2 rounded-md bg-[var(--gov-blue)] px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                >
                                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                                    Upload Document
                                </button>
                            </motion.div>
                        )}

                        {/* STATE 2: DOCUMENTS_PENDING */}
                        {currentStatus === 'DOCUMENTS_PENDING' && (
                            <motion.div
                                key="docs_pending"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--gov-blue)]" />
                                <div className="mb-6 pl-2">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                        Step 2: Pre-Verification
                                    </h2>
                                    <p className="text-sm font-medium text-slate-600">
                                        Documents received. Our automated engine will now verify the claimant identity and document validity.
                                    </p>
                                </div>

                                <div className="mb-8 rounded-md border border-indigo-200 bg-indigo-50 p-5 shadow-sm ml-2">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-indigo-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-indigo-900">Ready for Engine Verification</p>
                                            <p className="text-xs font-medium text-indigo-700 mt-1">If you need to upload more documents, you can do so below. Otherwise, initiate the verification engine.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pl-2">
                                    <button
                                        onClickCapture={() => setPageState({ ...pageState, currentStatus: 'INITIATED' })}
                                        className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Upload More Docs
                                    </button>
                                    <button
                                        onClick={handlePreVerify}
                                        disabled={verifying}
                                        className="flex items-center justify-center gap-2 rounded-md bg-[var(--gov-blue)] px-4 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-60 transition-all"
                                    >
                                        {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                        Run Engine Check
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STATE 3: PRE_VERIFIED */}
                        {currentStatus === 'PRE_VERIFIED' && (
                            <motion.div
                                key="pre_verified"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--gov-blue)]" />
                                <div className="mb-6 pl-2">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                                        <Send className="h-5 w-5 text-[var(--gov-gold)]" />
                                        Step 3: Final Submission
                                    </h2>
                                    <p className="text-sm font-medium text-slate-600">
                                        Review the verification results below and submit your claim to the department.
                                    </p>
                                </div>

                                {isClean ? (
                                    <div className="mb-8 rounded-md border border-emerald-200 bg-emerald-50 p-5 shadow-sm ml-2">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-emerald-900">Verification Passed (CLEAN)</p>
                                                <p className="text-xs font-medium text-emerald-700 mt-1">All details match correctly. You may proceed to final submission.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-8 rounded-md border border-red-200 bg-red-50 p-5 shadow-sm ml-2">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-red-900">Verification Flagged</p>
                                                <p className="text-xs font-medium text-red-700 mt-1">{latestEvent.note}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pl-2">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!isClean || submitting}
                                        className="w-full flex items-center justify-center gap-2 rounded-md bg-[var(--gov-gold)] px-5 py-3 text-sm font-bold text-[var(--gov-blue)] shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                        Finalize & Submit Application
                                    </button>

                                    {!isClean && (
                                        <p className="text-center text-xs font-medium text-slate-500 mt-4">
                                            You must resolve the flagged issues before submitting. <br />
                                            Contact support for manual override if this is a mistake.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* STATE 4+: POST-SUBMITTED STATES */}
                        {['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'APPROVED', 'SETTLED', 'REJECTED'].includes(currentStatus) && (
                            <motion.div
                                key="submitted_post"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-1 h-full ${
                                    currentStatus === 'REJECTED' ? 'bg-red-500' : 
                                    ['APPROVED', 'SETTLED'].includes(currentStatus) ? 'bg-emerald-500' : 
                                    'bg-[var(--gov-blue)]'
                                }`} />
                                
                                <div className="flex flex-col items-center text-center pb-2 pt-4">
                                    <div className={`flex h-20 w-20 items-center justify-center rounded-full border mb-6 shadow-sm ${
                                        currentStatus === 'REJECTED' ? 'bg-red-50 border-red-200' : 
                                        ['APPROVED', 'SETTLED'].includes(currentStatus) ? 'bg-emerald-50 border-emerald-200' : 
                                        'bg-blue-50 border-blue-200'
                                    }`}>
                                        {currentStatus === 'REJECTED' ? <XCircle className="h-10 w-10 text-red-600" /> :
                                         ['APPROVED', 'SETTLED'].includes(currentStatus) ? <CheckCircle2 className="h-10 w-10 text-emerald-600" /> :
                                         <Clock className="h-10 w-10 text-blue-600" />}
                                    </div>
                                    <h2 className={`text-2xl font-black tracking-tight mb-2 ${
                                        currentStatus === 'REJECTED' ? 'text-red-700' : 
                                        ['APPROVED', 'SETTLED'].includes(currentStatus) ? 'text-emerald-700' : 
                                        'text-[var(--gov-blue)]'
                                    }`}>
                                        {currentStatus.replace('_', ' ')}
                                    </h2>
                                    <p className="text-sm font-medium text-slate-600 max-w-sm ml-auto mr-auto mb-8">
                                        {currentStatus === 'REJECTED' 
                                            ? 'Your claim was rejected by the administrator. Please check the timeline notes for details.'
                                            : currentStatus === 'APPROVED' || currentStatus === 'SETTLED'
                                            ? 'Your claim has been approved! The benefits are being processed for disbursal.'
                                            : 'Your claim has been successfully routed. No further action is required from you at this moment while the department processes it.'}
                                    </p>

                                    <div className="w-full rounded-md border border-slate-200 bg-slate-50 p-5 text-left shadow-sm">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Latest Status Update</p>
                                        <p className="text-sm font-bold text-slate-900 flex items-start gap-3">
                                            {currentStatus === 'UNDER_ADMIN_REVIEW' || currentStatus === 'SUBMITTED' ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-blue-500 shrink-0" />
                                            ) : (
                                                <Info className="h-5 w-5 text-slate-500 shrink-0" />
                                            )}
                                            {latestEvent.note}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Area: Timeline Stepper */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden relative self-start">
                    <div className="absolute top-0 w-full h-1 bg-[var(--gov-gold)] left-0" />
                    <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2 mt-2">
                        <svg className="h-5 w-5 text-[var(--gov-blue)]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z"/><path d="M12 13v8"/><path d="M12 3v3"/></svg>
                        Claim Progress Tracker
                    </h3>

                    <div className="relative pl-4 space-y-6">
                        {/* Timeline Track Line */}
                        <div className="absolute left-[20px] top-4 bottom-8 w-[2px] bg-slate-200" />

                        {timelineStages.map((stage) => {
                            const meta = getStageMeta(stage);
                            
                            // Determine status
                            const eventDetail = timeline.find(e => e.status === stage);
                            let isCompleted = !!eventDetail;
                            
                            const highestCompletedIndex = Math.max(
                                ...timeline.map(e => STAGE_ORDER.indexOf(e.status)).filter(i => i >= 0),
                                0
                            );
                            
                            const stageIndex = STAGE_ORDER.indexOf(stage);
                            const isCurrent = stageIndex === highestCompletedIndex + 1 && !isRejected;
                            const isRejectedNode = isRejected && stage === 'REJECTED';

                            let indicatorClass = "bg-white border-[3px] border-slate-300";
                            let textClass = "text-slate-500";
                            if (isCompleted) {
                                indicatorClass = "bg-emerald-500 border-[3px] border-emerald-500 ring-4 ring-emerald-50 z-10";
                                textClass = "text-slate-900";
                            } else if (isCurrent) {
                                indicatorClass = "bg-white border-[3px] border-[var(--gov-blue)] ring-4 ring-blue-50 z-10";
                                textClass = "text-[var(--gov-blue)]";
                            } else if (isRejectedNode) {
                                indicatorClass = "bg-red-500 border-[3px] border-red-500 ring-4 ring-red-50 z-10";
                                textClass = "text-red-700";
                            }

                            return (
                                <div key={stage} className="relative flex items-start gap-4">
                                    <div className="absolute -left-1.5 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white pt-0.5">
                                        <div className={`h-3 w-3 rounded-full ${indicatorClass}`} />
                                    </div>

                                    <div className={`flex-1 pl-6 ${!isCompleted && !isCurrent && !isRejectedNode ? 'opacity-50' : ''}`}>
                                        <h4 className={`text-sm font-bold tracking-tight mb-0.5 ${textClass}`}>
                                            {meta.label}
                                        </h4>
                                        <p className="text-xs font-medium text-slate-500 mb-1.5">
                                            {meta.desc}
                                        </p>

                                        {eventDetail && (
                                            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
                                                <Calendar className="h-3 w-3" /> 
                                                {new Date(eventDetail.updatedAt).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        )}

                                        {eventDetail?.note && stage !== currentStatus && (
                                            <div className="mt-1.5 p-2 bg-slate-50 rounded-md border border-slate-200 text-xs font-medium text-slate-700 shadow-sm overflow-hidden text-ellipsis">
                                                {eventDetail.note}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DynamicClaimPage({ params }: { params: Promise<{ claimId: string }> }) {
    const resolvedParams = use(params);

    return (
        <ProtectedRoute requiredRole="USER">
            <ClaimDetailsContent claimId={resolvedParams.claimId} />
        </ProtectedRoute>
    );
}
