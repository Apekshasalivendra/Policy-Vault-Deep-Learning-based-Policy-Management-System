'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { authApi } from '@/lib/api';
import { getToken, setToken, removeToken, decodeToken } from '@/lib/auth';
import { AuthUser, Role } from '@/types';

interface AuthContextValue {
    user: AuthUser | null;
    role: Role | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setLoading] = useState(true);

    // Restore session from stored token on mount
    useEffect(() => {
        const token = getToken();
        if (token) {
            const decoded = decodeToken(token) as AuthUser | null;
            if (decoded?.userId) {
                setUser(decoded);
            } else {
                removeToken();
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await authApi.login(email, password);
        const token = res.data.token;
        setToken(token);
        const decoded = decodeToken(token) as unknown as AuthUser;
        setUser(decoded);
    }, []);

    const logout = useCallback(() => {
        removeToken();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                role: user?.role ?? null,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
