'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: Role;
}

// Shown while session is being restored from localStorage
function AuthLoading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                <p className="text-sm">Checking session…</p>
            </div>
        </div>
    );
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, role, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Wait until context has finished restoring session
        if (isLoading) return;

        // No valid session → send to login
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        // Role mismatch → send to home
        if (requiredRole && role !== requiredRole) {
            router.replace('/');
        }
    }, [isAuthenticated, role, isLoading, requiredRole, router]);

    // Show spinner while restoring session or redirecting
    if (isLoading || !isAuthenticated) return <AuthLoading />;
    if (requiredRole && role !== requiredRole) return <AuthLoading />;

    return <>{children}</>;
}
