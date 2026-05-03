'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, FileText, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

export default function UploadDocumentsPage() {
    const params = useParams();
    const router = useRouter();
    const familyId = params.id as string;

    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            // Use the same origin as the configured API (port 3000 for backend)
            const apiBase = window.location.hostname === 'localhost' 
                ? 'http://localhost:3000' 
                : `${window.location.protocol}//${window.location.hostname}:3000`;

            const response = await fetch(`${apiBase}/api/families/${familyId}/documents`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Upload failed with status ${response.status}`);
            }

            setSuccess(true);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Failed to upload documents: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg"
                >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
                        <CheckCircle className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-slate-900">Documents Uploaded</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Your documents have been successfully submitted for review.
                        The admin will be notified to process your Family ID.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-8 w-full rounded-xl bg-[var(--gov-blue)] py-3 font-bold text-white shadow-sm hover:brightness-110 transition-all"
                    >
                        Return to Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 bg-[var(--gov-blue)] h-1.5 w-full" />
                
                <div className="mb-6">
                    <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600">
                        <ArrowLeft className="h-4 w-4" /> Back to Safety
                    </Link>
                    <h1 className="text-2xl font-black text-slate-900">Upload Documents</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Upload the requested documents for Family ID: <br />
                        <span className="font-mono font-bold text-[var(--gov-blue)]">{familyId}</span>
                    </p>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:bg-slate-100">
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                            <Upload className="h-8 w-8" />
                        </div>
                        <span className="text-sm font-bold text-[var(--gov-blue)]">Click to browse files</span>
                        <span className="mt-1 text-xs text-slate-500">PDF, JPG, PNG up to 10MB</span>
                    </label>
                </div>

                {files.length > 0 && (
                    <div className="mt-6 space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Selected Files</h3>
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <FileText className="h-5 w-5 text-slate-400" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate text-sm font-medium text-slate-700">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gov-blue)] py-3.5 font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50 transition-all"
                >
                    {uploading ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Uploading…</>
                    ) : (
                        'Submit Documents'
                    )}
                </button>
            </motion.div>
        </div>
    );
}
