// Token helpers — sessionStorage (tab-isolated) + cross-tab expiry check
const TOKEN_KEY = 'govvault_token';

export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    // Validate token hasn't expired (client-side check)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000; // JWT exp is in seconds
        if (Date.now() >= expiry) {
            sessionStorage.removeItem(TOKEN_KEY); // Auto-clear expired token
            return null;
        }
    } catch {
        sessionStorage.removeItem(TOKEN_KEY); // Invalid token structure
        return null;
    }

    return token;
};

export const setToken = (token: string): void => {
    sessionStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
    sessionStorage.removeItem(TOKEN_KEY);
};

// Decode JWT payload without verifying signature (client-side display only)
export const decodeToken = (token: string): Record<string, unknown> | null => {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
};

// Check if token is expired (without removing it)
export const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
};
