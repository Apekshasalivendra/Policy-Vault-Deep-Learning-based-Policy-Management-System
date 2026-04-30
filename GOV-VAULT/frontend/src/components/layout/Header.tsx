'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, LogOut, LayoutDashboard, FileText, Sparkles, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const { isAuthenticated, role, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="sticky top-0 z-50 border-b border-[var(--gov-gold)]/20 bg-[var(--gov-blue)] shadow-lg"
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--gov-gold)] shadow-sm">
                        <Shield className="h-5 w-5 text-[var(--gov-blue)]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight text-white leading-tight">
                            PARIVAR<span className="text-[var(--gov-gold)]">-NETRA</span>
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-300 leading-none">
                            Unified Family Governance
                        </span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                    {isAuthenticated && role === 'USER' && (
                        <>
                            <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
                            <NavLink href="/apply" icon={<Users className="h-4 w-4" />} label="Apply" />
                            <NavLink href="/recommendations" icon={<Sparkles className="h-4 w-4" />} label="Schemes" />
                            <NavLink href="/dashboard/policies" icon={<Shield className="h-4 w-4" />} label="Policies" />
                            <NavLink href="/claims" icon={<FileText className="h-4 w-4" />} label="Claims" />
                        </>
                    )}

                    {isAuthenticated && role === 'ADMIN' && (
                        <>
                            <NavLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
                            <NavLink href="/admin/families" icon={<FileText className="h-4 w-4" />} label="Families" />
                            <NavLink href="/admin/claims" icon={<FileText className="h-4 w-4" />} label="Claims" />
                        </>
                    )}

                    {!isAuthenticated && (
                        <>
                            <NavLink href="/login" label="Login" />
                            <Link
                                href="/register"
                                className="ml-2 rounded-sm bg-[var(--gov-gold)] px-4 py-2 text-sm font-bold text-[var(--gov-blue)] hover:brightness-110 transition-all shadow-sm"
                            >
                                Register
                            </Link>
                        </>
                    )}

                    {isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            className="ml-3 flex items-center gap-1.5 rounded-sm border border-red-400/30 px-3 py-1.5 text-sm font-medium text-red-200 hover:bg-red-500/10 hover:text-white transition-all"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    )}
                </nav>
            </div>
        </motion.header>
    );
}

function NavLink({
    href,
    label,
    icon,
}: {
    href: string;
    label: string;
    icon?: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-all"
        >
            {icon}
            {label}
        </Link>
    );
}
