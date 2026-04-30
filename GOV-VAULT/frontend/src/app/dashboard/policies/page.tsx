'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, User, CheckCircle, Clock, XCircle, AlertCircle,
    Loader2, Skull, FileText, ChevronRight, AlertTriangle, Building2,
    Camera, UploadCloud, FileCheck
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { familyApi } from '@/lib/api';

declare global {
    interface Window {
        Razorpay: any;
    }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FamilyMember {
    id: string;
    name: string;
    age: number;
    occupation: string;
    incomeRange: string;
}

interface MockPolicy {
    id: string;
    policyName: string;
    policyType: 'LIFE_INSURANCE' | 'PENSION' | 'HEALTH_INSURANCE';
    issuingAuthority: string;
    policyHolder: string;
    nominee: string | null;
    status: 'ACTIVE' | 'CLAIMED' | 'MATURED';
}

const policyStatusStyle: Record<string, string> = {
    ACTIVE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    MATURED: 'text-[var(--gov-blue)] bg-blue-50 border-blue-200',
    CLAIMED: 'text-slate-600 bg-slate-100 border-slate-200',
};

// ── Mock Generator ─────────────────────────────────────────────────────────────
function generateMockPolicies(members: FamilyMember[]): MockPolicy[] {
    if (!members || members.length === 0) return [];
    
    const policies: MockPolicy[] = [];
    const head = members[0];
    const spouseOrChild = members.length > 1 ? members[1] : members[0];
    const third = members.length > 2 ? members[2] : head;

    policies.push({
        id: 'LIC-89234710',
        policyName: 'Jeevan Anand (Endowment)',
        policyType: 'LIFE_INSURANCE',
        issuingAuthority: 'Life Insurance Corporation of India (LIC)',
        policyHolder: head.name,
        nominee: spouseOrChild.name,
        status: 'ACTIVE'
    });

    if (members.length > 1) {
        policies.push({
            id: 'YSR-BIMA-0092',
            policyName: 'YSR Bima Scheme',
            policyType: 'LIFE_INSURANCE',
            issuingAuthority: 'Government of Andhra Pradesh',
            policyHolder: spouseOrChild.name,
            nominee: head.name,
            status: 'ACTIVE'
        });
    }

    policies.push({
        id: 'EPFO-PEN-8182',
        policyName: 'Employee Pension Scheme (EPS)',
        policyType: 'PENSION',
        issuingAuthority: 'EPFO India',
        policyHolder: head.name,
        nominee: third.name,
        status: 'ACTIVE'
    });

    if (members.length > 2) {
        policies.push({
            id: 'PMJJBY-11029',
            policyName: 'Pradhan Mantri Jeevan Jyoti Bima Yojana',
            policyType: 'LIFE_INSURANCE',
            issuingAuthority: 'Union Government of India',
            policyHolder: third.name,
            nominee: head.name,
            status: 'ACTIVE'
        });
    }

    return policies;
}

// ── Camera Mock Component ──────────────────────────────────────────────────────
function CameraMock({ onCapture }: { onCapture: () => void }) {
    const [scanning, setScanning] = useState(true);
    const [captured, setCaptured] = useState(false);

    const handleCapture = () => {
        setScanning(false);
        setCaptured(true);
        setTimeout(() => {
            onCapture();
        }, 800);
    };

    return (
        <div className="relative overflow-hidden rounded-xl bg-slate-900 aspect-video flex items-center justify-center border-2 border-slate-200">
            {captured ? (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-emerald-400">
                    <CheckCircle className="h-10 w-10 mb-2" />
                    <span className="font-bold text-sm">Identity Captured</span>
                </motion.div>
            ) : (
                <>
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                    <User className="h-16 w-16 text-slate-700 opacity-50 absolute" />
                    {scanning && (
                        <motion.div
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] z-10"
                        />
                    )}
                    <button
                        onClick={handleCapture}
                        className="absolute bottom-4 z-20 flex items-center gap-2 bg-white text-slate-900 font-bold px-4 py-2 rounded-full shadow-lg hover:bg-slate-100 transition-all text-xs"
                    >
                        <Camera className="h-4 w-4" />
                        Take Photo
                    </button>
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 text-white text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Verification
                    </div>
                </>
            )}
        </div>
    );
}

// ── Claim Flow Modal ──────────────────────────────────────────────────────────
function ClaimModal({
    policy,
    currentUser,
    onClose,
    onSuccess
}: {
    policy: MockPolicy;
    currentUser: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    // Steps: 1: Select Type -> 2: Flow (dependent vs non-dependent) -> 3: Complete
    const [step, setStep] = useState(1);
    const [claimType, setClaimType] = useState<'MATURITY' | 'DEATH' | null>(null);
    const [relation, setRelation] = useState('');
    const [photoCaptured, setPhotoCaptured] = useState(false);
    const [fileUploaded, setFileUploaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState<'RAZORPAY' | 'MANUAL'>('RAZORPAY');

    const isDependent = policy.nominee === currentUser;

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleNext = async () => {
        if (step === 1 && claimType) setStep(2);
        else if (step === 2) setStep(3);
        else if (step === 3) {
            setLoading(true);
            
            if (verificationMethod === 'RAZORPAY') {
                const sdkLoaded = await loadRazorpay();
                if (!sdkLoaded) {
                    alert('Failed to load Razorpay SDK');
                    setLoading(false);
                    return;
                }
                const options = {
                    key: 'rzp_test_ScHtzspSTvvi1X',
                    amount: '100', // 1 INR in paise
                    currency: 'INR',
                    name: 'GOV-VAULT KYC',
                    description: 'Penny Drop Bank Verification',
                    handler: function (response: any) {
                        setLoading(false);
                        setStep(4);
                        setTimeout(onSuccess, 2000);
                    },
                    modal: {
                        ondismiss: function() {
                            setLoading(false);
                        }
                    },
                    prefill: {
                        name: currentUser,
                        email: 'user@govvault.in'
                    },
                    theme: { color: '#2563eb' }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                // Manual Upload
                setTimeout(() => {
                    setLoading(false);
                    setStep(4);
                    setTimeout(onSuccess, 2000);
                }, 1500);
            }
        }
    };

    const isStep2Valid = claimType === 'MATURITY' 
        ? photoCaptured 
        : claimType === 'DEATH'
            ? (isDependent ? photoCaptured : (photoCaptured && fileUploaded && relation !== ''))
            : false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Claim Initiation</h3>
                        <p className="text-xs font-medium text-[var(--gov-blue)] mt-0.5">{policy.policyName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <XCircle className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* STEP 1: Claim Type */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Select Claim Nature</p>
                            
                            <label className={`flex cursor-pointer border-2 rounded-xl p-4 gap-4 transition-all ${claimType === 'MATURITY' ? 'border-[var(--gov-blue)] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input type="radio" className="mt-1" name="claimType" checked={claimType === 'MATURITY'} onChange={() => setClaimType('MATURITY')} />
                                <div>
                                    <p className="font-bold text-slate-900">Maturity / Survival Benefit</p>
                                    <p className="text-xs text-slate-500 mt-1">Claim this policy as the active policyholder ({policy.policyHolder}).</p>
                                </div>
                            </label>

                            <label className={`flex cursor-pointer border-2 rounded-xl p-4 gap-4 transition-all ${claimType === 'DEATH' ? 'border-red-500 bg-red-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input type="radio" className="mt-1" name="claimType" checked={claimType === 'DEATH'} onChange={() => setClaimType('DEATH')} />
                                <div>
                                    <p className="font-bold text-red-700 flex items-center gap-2"><Skull className="h-4 w-4"/> Report Death & Claim</p>
                                    <p className="text-xs text-red-600/80 mt-1">Report the demise of {policy.policyHolder} and process survivor benefits.</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* STEP 2: e-KYC & Validation */}
                    {step === 2 && claimType === 'DEATH' && (
                        <div className="space-y-6">
                            {isDependent ? (
                                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex gap-3">
                                    <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-900">Dependency Validated</p>
                                        <p className="text-xs text-emerald-700 mt-1">You ({currentUser}) are the registered nominee. Simplified e-KYC enabled.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex gap-3">
                                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900">Unregistered Dependent</p>
                                        <p className="text-xs text-amber-800 mt-1">You are not the primary nominee. Additional verification required.</p>
                                    </div>
                                </div>
                            )}

                            {!isDependent && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 border-t border-slate-100 pt-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Upload Death Certificate *</label>
                                        <div 
                                            onClick={() => setFileUploaded(true)}
                                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${fileUploaded ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            {fileUploaded ? (
                                                <div className="text-emerald-700 flex flex-col items-center">
                                                    <FileCheck className="h-8 w-8 mb-2" />
                                                    <span className="text-xs font-bold">Document Uploaded Successfully</span>
                                                </div>
                                            ) : (
                                                <div className="text-slate-500 flex flex-col items-center">
                                                    <UploadCloud className="h-8 w-8 mb-2" />
                                                    <span className="text-xs font-medium">Click to mock upload certificate</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Relation to Policyholder *</label>
                                        <select 
                                            value={relation}
                                            onChange={(e) => setRelation(e.target.value)}
                                            className="w-full border-slate-200 rounded-md text-sm p-2 bg-slate-50 focus:border-[var(--gov-blue)] focus:ring-1 focus:ring-[var(--gov-blue)]"
                                        >
                                            <option value="">Select Relation...</option>
                                            <option value="SPOUSE">Spouse</option>
                                            <option value="CHILD">Child</option>
                                            <option value="PARENT">Parent</option>
                                            <option value="OTHER">Other Guardian</option>
                                        </select>
                                    </div>
                                </motion.div>
                            )}

                            <div className="border-t border-slate-100 pt-4">
                                <label className="block text-xs font-bold text-slate-700 mb-3">Live Face Verification (e-KYC) *</label>
                                <CameraMock onCapture={() => setPhotoCaptured(true)} />
                            </div>
                        </div>
                    )}

                    {/* Step 2 for MATURITY */}
                    {step === 2 && claimType === 'MATURITY' && (
                        <div className="space-y-6">
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                                <p className="text-sm font-bold text-blue-900">Identity Verification Required</p>
                                <p className="text-xs text-blue-700 mt-1">Please verify your identity live to claim maturity benefits.</p>
                            </div>
                            <CameraMock onCapture={() => setPhotoCaptured(true)} />
                        </div>
                    )}

                    {/* STEP 3: KYC Method Selection */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                                <p className="text-sm font-bold text-slate-900">Final Step: Bank Account Verification</p>
                                <p className="text-xs text-slate-600 mt-1">We need to verify the payout bank account matches your identity.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div 
                                    onClick={() => setVerificationMethod('RAZORPAY')}
                                    className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${verificationMethod === 'RAZORPAY' ? 'border-[var(--gov-blue)] bg-blue-50 ring-1 ring-[var(--gov-blue)]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                                >
                                    <div className="flex justify-center mb-2"><CheckCircle className={`h-5 w-5 ${verificationMethod === 'RAZORPAY' ? 'text-[var(--gov-blue)]' : 'text-slate-400'}`} /></div>
                                    <p className="text-sm font-bold text-slate-900">Instant API Match</p>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wide">1 INR Razorpay Demo</p>
                                </div>
                                <div 
                                    onClick={() => setVerificationMethod('MANUAL')}
                                    className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${verificationMethod === 'MANUAL' ? 'border-[var(--gov-blue)] bg-blue-50 ring-1 ring-[var(--gov-blue)]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                                >
                                    <div className="flex justify-center mb-2"><FileText className={`h-5 w-5 ${verificationMethod === 'MANUAL' ? 'text-[var(--gov-blue)]' : 'text-slate-400'}`} /></div>
                                    <p className="text-sm font-bold text-slate-900">Manual Upload</p>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wide">Passbook Copy</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Success */}
                    {step === 4 && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center flex flex-col items-center">
                            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Claim Initiated!</h2>
                            <p className="text-sm text-slate-500 max-w-xs px-4">Your entitlement claim has been submitted securely to the governance node and is pending review.</p>
                        </motion.div>
                    )}
                </div>

                {/* Footer buttons */}
                {step < 4 && (
                    <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 shrink-0">
                        <button disabled={loading} onClick={onClose} className="flex-1 rounded border border-slate-300 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all">
                            Cancel
                        </button>
                        <button 
                            disabled={!claimType || (step === 2 && !isStep2Valid) || loading}
                            onClick={handleNext} 
                            className="flex-1 rounded bg-[var(--gov-blue)] py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={step === 2 && !isStep2Valid ? "Please complete all required fields and verifications" : ""}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 3 ? (verificationMethod === 'RAZORPAY' ? 'Verify via Razorpay (₹1)' : 'Submit Claim') : 'Continue to Next Step'}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ── Main Page Content ──────────────────────────────────────────────────────────
function PoliciesContent() {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [mockPolicies, setMockPolicies] = useState<MockPolicy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // UI State
    const [activePolicy, setActivePolicy] = useState<MockPolicy | null>(null);

    // Initial Fetch
    useEffect(() => {
        familyApi.getMyFamily()
            .then((r) => {
                const family = (r.data as any).family;
                if (family?.members) {
                    setMembers(family.members);
                    setMockPolicies(generateMockPolicies(family.members));
                }
            })
            .catch(() => setError('Could not load family vault data.'))
            .finally(() => setLoading(false));
    }, []);

    const currentUser = members[0]?.name || 'Unknown User';

    const handleClaimSuccess = () => {
        if (!activePolicy) return;
        // Update local mock state immediately
        setMockPolicies(prev => prev.map(p => 
            p.id === activePolicy.id ? { ...p, status: 'CLAIMED' } : p
        ));
        setActivePolicy(null);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--gov-blue)] shadow-md">
                        <Shield className="h-7 w-7 text-[var(--gov-gold)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Family Policy Vault</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Unified view of all insurances and pensions registered to your household.</p>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-32">
                    <Loader2 className="h-10 w-10 animate-spin text-[var(--gov-blue)]" />
                    <p className="text-sm font-bold text-slate-500">Decrypting Vault Records…</p>
                </div>
            ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-800 flex flex-col items-center">
                    <AlertCircle className="h-10 w-10 text-red-500 mb-2" /> 
                    {error}
                </div>
            ) : mockPolicies.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-16 text-center">
                    <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-bold text-slate-600">Vault Empty</p>
                    <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm mx-auto">No members or policies found in this household's registry.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {mockPolicies.map((policy, idx) => (
                        <motion.div
                            key={policy.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col"
                        >
                            {/* Card Decorative top bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${policy.status === 'CLAIMED' ? 'bg-slate-300' : 'bg-[var(--gov-blue)]'}`} />

                            <div className="flex justify-between items-start mb-5 mt-1">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">Policy ID: {policy.id}</span>
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{policy.policyName}</h3>
                                    <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                                        <Building2 className="h-3.5 w-3.5" /> {policy.issuingAuthority}
                                    </p>
                                </div>
                                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${policyStatusStyle[policy.status]}`}>
                                    {policy.status}
                                </span>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Policyholder</p>
                                        <p className="text-sm font-bold text-slate-800">{policy.policyHolder}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Dependent / Nominee</p>
                                        <p className="text-sm font-bold text-[var(--gov-blue)] bg-blue-50/50 inline-block px-1.5 -mx-1.5 rounded">{policy.nominee || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {policy.status !== 'CLAIMED' ? (
                                <button 
                                    onClick={() => setActivePolicy(policy)}
                                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 py-3 text-sm font-bold text-white transition-colors shadow-sm"
                                >
                                    Initiate Claim <ChevronRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <div className="w-full text-center py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border border-slate-200 rounded-lg bg-slate-50">
                                    Claim Processed
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Claim Flow Modal */}
            <AnimatePresence>
                {activePolicy && (
                    <ClaimModal
                        policy={activePolicy}
                        currentUser={currentUser}
                        onClose={() => setActivePolicy(null)}
                        onSuccess={handleClaimSuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function PoliciesPage() {
    return (
        <ProtectedRoute requiredRole="USER">
            <PoliciesContent />
        </ProtectedRoute>
    );
}
