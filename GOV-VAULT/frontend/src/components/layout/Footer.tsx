import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t border-white/10 bg-slate-950 py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Shield className="h-4 w-4 text-indigo-500" />
                    <span>GOV-VAULT &copy; {new Date().getFullYear()}</span>
                </div>
                <p className="text-xs text-slate-600">
                    Secure Government Welfare Management System
                </p>
            </div>
        </footer>
    );
}
