// Token helpers — localStorage for prototype, httpOnly cookie for production
const TOKEN_KEY = 'govvault_token';

export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
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
