'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    Users, Shield, CheckCircle, XCircle, ArrowRight, Loader2, Fingerprint, 
    Banknote, HeartHandshake, AlertCircle, Search, Home, FileText 
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'register' | 'verify' | 'funds';

function OrphanManagement() {
    const [activeTab, setActiveTab] = useState<Tab>('register');
    const [orphans, setOrphans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ id: string; kind: 'success' | 'error'; message: string } | null>(null);

    const showToast = (kind: 'success' | 'error', message: string) => {
        const id = Math.random().toString();
        setToast({ id, kind, message });
        setTimeout(() => setToast(null), 4000);
    };

    const loadOrphans = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getOrphans();
            setOrphans(res.data.orphans || []);
        } catch (error) {
            showToast('error', 'Failed to load orphans data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOrphans(); }, []);

    // Registration State
    const [regForm, setRegForm] = useState({ name: '', fatherName: '', motherName: '', guardianName: '', currentAddress: '' });
    const [scanning, setScanning] = useState(false);
    const [biometricsDone, setBiometricsDone] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [registeredData, setRegisteredData] = useState<any>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!biometricsDone) {
            showToast('error', 'Please capture biometrics first.');
            return;
        }
        setRegistering(true);
        try {
            const res = await adminApi.registerOrphan(regForm);
            setRegisteredData(res.data.orphan);
            showToast('success', 'Orphan registered successfully.');
            setRegForm({ name: '', fatherName: '', motherName: '', guardianName: '', currentAddress: '' });
            setBiometricsDone(false);
            loadOrphans();
        } catch (error) {
            showToast('error', 'Registration failed.');
        } finally {
            setRegistering(false);
        }
    };

    const handleBiometrics = () => {
        setScanning(true);
        setTimeout(() => {
            setScanning(false);
            setBiometricsDone(true);
            showToast('success', 'Biometrics captured successfully.');
        }, 2500);
    };

    // Verification State
    const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
        try {
            await adminApi.verifyOrphan(id, status);
            showToast('success', `Verification marked as ${status}.`);
            loadOrphans();
        } catch (error) {
            showToast('error', 'Verification update failed.');
        }
    };

    // Fund State
    const [feeForm, setFeeForm] = useState<{ id: string | null; amount: string; purpose: string; toWhom: string }>({ id: null, amount: '', purpose: '', toWhom: '' });
    const [deducting, setDeducting] = useState(false);

    const handleDeduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feeForm.id) return;
        setDeducting(true);
        try {
            await adminApi.deductOrphanFund(feeForm.id, {
                amount: parseFloat(feeForm.amount),
                purpose: feeForm.purpose,
                toWhom: feeForm.toWhom
            });
            showToast('success', 'Funds processed and deducted successfully.');
            setFeeForm({ id: null, amount: '', purpose: '', toWhom: '' });
            loadOrphans();
        } catch (error: any) {
            showToast('error', error.response?.data?.error || 'Failed to process funds.');
        } finally {
            setDeducting(false);
        }
    };

    const pendingVerifications = orphans.filter(o => o.policeVerification === 'PENDING');
    const activeFunds = orphans.filter(o => o.policeVerification === 'VERIFIED' && o.trustFund);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 min-h-screen pb-20">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border-2 px-6 py-4 text-sm font-black shadow-2xl backdrop-blur ${toast.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}
                    >
                        {toast.kind === 'success' ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-10">
                <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 inline-block">← Back to Dashboard</Link>
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 border-2 border-cyan-200 shadow-sm">
                        <HeartHandshake className="h-7 w-7 text-cyan-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Direct Child Policy Claims</h1>
                        <p className="text-sm font-semibold text-slate-500 mt-1">Orphan Trust Fund Management & Registration Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto border border-slate-200">
                {[
                    { id: 'register', label: 'Walk-in Registration', icon: Users },
                    { id: 'verify', label: `Police Verification (${pendingVerifications.length})`, icon: Shield },
                    { id: 'funds', label: 'Trust Funds Management', icon: Banknote },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as Tab)}
                        className={`flex whitespace-nowrap flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${activeTab === t.id ? 'bg-white text-cyan-700 shadow border-cyan-100 border' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}
                    >
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10">
                {/* ── TAB 1: REGISTRATION ────────────────────────────────────────── */}
                {activeTab === 'register' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Users className="text-cyan-600" /> Child Registration Details
                            </h2>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Child's Name</label>
                                    <input required type="text" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold focus:border-cyan-500 focus:outline-none" placeholder="Enter full name" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Father's Name</label>
                                        <input required type="text" value={regForm.fatherName} onChange={e => setRegForm({...regForm, fatherName: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold focus:border-cyan-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mother's Name</label>
                                        <input required type="text" value={regForm.motherName} onChange={e => setRegForm({...regForm, motherName: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold focus:border-cyan-500 focus:outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Guardian Name (Optional)</label>
                                    <input type="text" value={regForm.guardianName} onChange={e => setRegForm({...regForm, guardianName: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold focus:border-cyan-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Address</label>
                                    <textarea required value={regForm.currentAddress} onChange={e => setRegForm({...regForm, currentAddress: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold focus:border-cyan-500 focus:outline-none h-24 resize-none" placeholder="Enter physical address for police verification" />
                                </div>

                                <button disabled={registering || !biometricsDone} type="submit" className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-4 text-base font-black text-white hover:bg-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {registering ? <Loader2 className="animate-spin" /> : <CheckCircle />} Complete Registration & Generate ID
                                </button>
                            </form>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="rounded-3xl border-2 border-slate-100 bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
                                <h3 className="text-lg font-black text-slate-900 mb-2">Biometric Scan</h3>
                                <p className="text-sm font-semibold text-slate-500 mb-8">Iris and fingerprint authentication required before registration.</p>
                                
                                <div className="relative mb-6">
                                    <motion.div animate={scanning ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ repeat: scanning ? Infinity : 0, duration: 1 }}>
                                        <Fingerprint className={`h-32 w-32 ${biometricsDone ? 'text-emerald-500' : scanning ? 'text-cyan-500' : 'text-slate-300'}`} />
                                    </motion.div>
                                    {scanning && (
                                        <motion.div initial={{ top: 0 }} animate={{ top: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10" />
                                    )}
                                </div>

                                {biometricsDone ? (
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                                        <CheckCircle size={18} /> Biometrics Verified
                                    </div>
                                ) : (
                                    <button onClick={handleBiometrics} disabled={scanning} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                                        {scanning ? 'Scanning...' : 'Start Scan Device'}
                                    </button>
                                )}
                            </div>

                            {registeredData && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={14}/> Registration Successful</p>
                                    <div className="space-y-3">
                                        <div className="bg-white px-4 py-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Temp Child ID</span>
                                            <span className="font-mono font-black text-slate-900">{registeredData.tempId}</span>
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Auto-Generated Aadhaar</span>
                                            <span className="font-mono font-black text-slate-900">{registeredData.aadhaarNumber}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-emerald-700 mt-4 text-center">Child is now pending police verification.</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── TAB 2: POLICE VERIFICATION ──────────────────────────────────── */}
                {activeTab === 'verify' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-slate-900">Police Verification Queue</h2>
                            <p className="text-sm font-semibold text-slate-500 mt-1">Verify parents' death and address to release policy funds.</p>
                        </div>

                        {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-cyan-500" /></div> : pendingVerifications.length === 0 ? (
                            <div className="py-20 text-center text-slate-500 font-bold border-2 border-dashed border-slate-200 rounded-2xl">No pending verifications.</div>
                        ) : (
                            <div className="space-y-4">
                                {pendingVerifications.map(orphan => (
                                    <div key={orphan.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border-2 border-slate-100 bg-slate-50 p-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 font-black text-[10px] rounded uppercase">Pending</span>
                                                <span className="font-mono font-black text-slate-700">{orphan.tempId}</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900">{orphan.name}</p>
                                            <div className="text-xs font-semibold text-slate-500 grid grid-cols-2 gap-x-8 gap-y-1 mt-2">
                                                <p>Father: <span className="text-slate-700">{orphan.fatherName}</span></p>
                                                <p>Mother: <span className="text-slate-700">{orphan.motherName}</span></p>
                                                <p className="col-span-2 flex items-start gap-1 mt-1"><Home size={12} className="mt-0.5 shrink-0"/> {orphan.currentAddress}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <button onClick={() => handleVerify(orphan.id, 'VERIFIED')} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 transition-all">
                                                <Shield size={16} /> Verify & Setup Fund
                                            </button>
                                            <button onClick={() => handleVerify(orphan.id, 'REJECTED')} className="flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-red-200 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 transition-all">
                                                <XCircle size={16} /> Reject Claim
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── TAB 3: TRUST FUNDS ────────────────────────────────────────── */}
                {activeTab === 'funds' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Active Trust Funds</h2>
                                <p className="text-sm font-semibold text-slate-500 mt-1">Manage verified children and process fee requests.</p>
                            </div>
                        </div>

                        {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-cyan-500" /></div> : activeFunds.length === 0 ? (
                            <div className="py-20 text-center text-slate-500 font-bold border-2 border-dashed border-slate-200 rounded-2xl">No active trust funds available.</div>
                        ) : (
                            <div className="space-y-6">
                                {activeFunds.map(orphan => (
                                    <div key={orphan.id} className="rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-black text-slate-900 text-lg">{orphan.name}</span>
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-black text-[10px] rounded uppercase border border-emerald-200">Verified</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-500">Permanent ID: <span className="font-mono text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded">{orphan.permanentId}</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Available Balance</p>
                                                <p className="text-2xl font-black text-emerald-600">₹{orphan.trustFund.balance.toLocaleString('en-IN')}</p>
                                                <p className="text-[10px] font-bold text-slate-400">Total Provisioned: ₹{orphan.trustFund.totalAmount.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2">
                                            {/* Process Fee Form */}
                                            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200">
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Process New Payment</h3>
                                                <form onSubmit={(e) => { setFeeForm(prev => ({...prev, id: orphan.id})); handleDeduct(e); }} className="space-y-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount (₹)</label>
                                                        <input required type="number" min="1" max={orphan.trustFund.balance} value={feeForm.id === orphan.id ? feeForm.amount : ''} onChange={e => setFeeForm({id: orphan.id, amount: e.target.value, purpose: feeForm.purpose, toWhom: feeForm.toWhom})} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold focus:border-cyan-500 outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Whom (Payee/Institution)</label>
                                                        <input required type="text" value={feeForm.id === orphan.id ? feeForm.toWhom : ''} onChange={e => setFeeForm({id: orphan.id, amount: feeForm.amount, purpose: feeForm.purpose, toWhom: e.target.value})} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold focus:border-cyan-500 outline-none" placeholder="e.g. St. Jude High School" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Purpose & Reason</label>
                                                        <input required type="text" value={feeForm.id === orphan.id ? feeForm.purpose : ''} onChange={e => setFeeForm({id: orphan.id, amount: feeForm.amount, purpose: e.target.value, toWhom: feeForm.toWhom})} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold focus:border-cyan-500 outline-none" placeholder="e.g. 10th Grade Tuition Fee" />
                                                    </div>
                                                    <button disabled={deducting} type="submit" className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 transition-all disabled:opacity-50">
                                                        {deducting && feeForm.id === orphan.id ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />} Deduct & Process Payment
                                                    </button>
                                                </form>
                                            </div>

                                            {/* Transaction History */}
                                            <div className="p-6 bg-slate-50/50">
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Transaction History</h3>
                                                {orphan.trustFund.transactions.length === 0 ? (
                                                    <p className="text-xs font-semibold text-slate-400 italic">No transactions yet.</p>
                                                ) : (
                                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {orphan.trustFund.transactions.map((tx: any) => (
                                                            <div key={tx.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-xs font-bold text-slate-900">{tx.purpose}</span>
                                                                    <span className="text-xs font-black text-red-600">-₹{tx.amount.toLocaleString('en-IN')}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                                                                    <span>To: {tx.toWhom}</span>
                                                                    <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function OrphansPage() {
    return <ProtectedRoute requiredRole="ADMIN"><OrphanManagement /></ProtectedRoute>;
}
