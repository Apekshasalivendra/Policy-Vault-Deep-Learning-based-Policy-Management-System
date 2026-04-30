'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Shield, LogOut, LayoutDashboard, FileText,
    Sparkles, Users, BookOpen, Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const { isAuthenticated, role, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const userLinks = [
        { href: '/dashboard',          icon: <LayoutDashboard size={15} />, label: 'Dashboard' },
        { href: '/apply',              icon: <Users size={15} />,           label: 'Apply'     },
        { href: '/recommendations',    icon: <Sparkles size={15} />,        label: 'Schemes'   },
        { href: '/dashboard/policies', icon: <BookOpen size={15} />,        label: 'Policies'  },
        { href: '/claims',             icon: <FileText size={15} />,        label: 'Claims'    },
    ];

    const adminLinks = [
        { href: '/admin',          icon: <LayoutDashboard size={15} />, label: 'Dashboard' },
        { href: '/admin/families', icon: <Users size={15} />,           label: 'Families'  },
        { href: '/admin/claims',   icon: <Activity size={15} />,        label: 'Claims'    },
        { href: '/admin/audit',    icon: <FileText size={15} />,        label: 'Audit'     },
    ];

    const links = role === 'ADMIN' ? adminLinks : userLinks;

    return (
        <header style={{ background: 'var(--gov-blue)', borderBottom: '2px solid var(--gov-gold)' }} className="sticky top-0 z-50 shadow-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                    <div style={{ background: 'var(--gov-gold)', borderRadius: 6 }}
                        className="flex h-9 w-9 items-center justify-center">
                        <Shield size={20} style={{ color: 'var(--gov-blue)' }} />
                    </div>
                    <div>
                        <div className="text-white font-black text-lg tracking-tight leading-none">
                            PARIVAR<span style={{ color: 'var(--gov-gold)' }}>-NETRA</span>
                        </div>
                        <div className="text-slate-300 text-[10px] uppercase tracking-widest leading-tight font-medium">
                            Unified Family Governance
                        </div>
                    </div>
                </Link>

                {/* Nav */}
                <nav className="flex items-center gap-0.5">
                    {isAuthenticated && links.map(link => {
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    background: active ? 'rgba(201, 162, 39, 0.18)' : 'transparent',
                                    color: active ? 'var(--gov-gold)' : 'rgba(255,255,255,0.82)',
                                    borderBottom: active ? '2px solid var(--gov-gold)' : '2px solid transparent',
                                    borderRadius: 0,
                                }}
                                className="flex items-center gap-1.5 px-4 h-16 text-sm font-semibold transition-all hover:text-white hover:bg-white/5"
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        );
                    })}

                    {!isAuthenticated && (
                        <>
                            <Link href="/login"
                                className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors">
                                Sign In
                            </Link>
                            <Link href="/register"
                                style={{ background: 'var(--gov-gold)', color: 'var(--gov-blue)', borderRadius: 7 }}
                                className="ml-2 px-4 py-2 text-sm font-bold hover:brightness-110 transition-all shadow-sm">
                                Register
                            </Link>
                        </>
                    )}

                    {isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            className="ml-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-300 hover:text-white hover:bg-red-500/20 transition-all"
                        >
                            <LogOut size={15} />
                            Logout
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}
