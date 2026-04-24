'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { entitlementApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { FileText, Loader2, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface AdminClaimList {
    id: string;
    memberId: string;
    claimantName: string;
    claimType: string;
    status: string;
    updatedAt: string;
    policy: {
        policyType: string;
        issuingAuthority: string;
    };
}

function AdminClaimsDashboard() {
    const [claims, setClaims] = useState<AdminClaimList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const res = await entitlementApi.adminGetSubmitted();
                setClaims(res.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load submitted claims.');
            } finally {
                setLoading(false);
            }
        };
        fetchClaims();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-sm font-medium text-slate-600">Loading Governance Queue...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-sm font-medium text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
                        <ShieldCheck className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Claim Intake Dashboard</h1>
                        <p className="text-sm font-medium text-slate-600 mt-0.5">Review and govern submitted multi-step claims.</p>
                    </div>
                </div>
            </motion.div>

            {claims.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center shadow-sm">
                    <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Queue Empty</h3>
                    <p className="text-sm font-medium text-slate-600">No active claims are currently awaiting administration.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Claim UUID</th>
                                    <th className="px-6 py-4">Claimant</th>
                                    <th className="px-6 py-4">Policy Type</th>
                                    <th className="px-6 py-4">Current Status</th>
                                    <th className="px-6 py-4">Last Updated</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {claims.map((claim) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={claim.id}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-[var(--gov-blue)]">{claim.id.split('-')[0]}...</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{claim.claimantName}</div>
                                            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{claim.claimType}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{claim.policy.policyType}</div>
                                            <div className="text-xs font-medium text-slate-500 mt-0.5">{claim.policy.issuingAuthority}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${claim.status === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                    claim.status === 'UNDER_ADMIN_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        claim.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                {claim.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                                            {new Date(claim.updatedAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/claims/${claim.id}`}
                                                className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--gov-blue)] px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-sm"
                                            >
                                                Manage <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminClaimsPage() {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminClaimsDashboard />
        </ProtectedRoute>
    );
}
