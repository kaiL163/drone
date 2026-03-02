'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND_URL = 'http://212.119.42.49:8000';

interface User {
    id: number;
    username: string;
    email: string;
    avatar_url?: string | null;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isAuthenticated: false,
    login: () => { },
    logout: () => { },
    checkSession: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    const fetchUser = async (authToken: string) => {
        if (!authToken) return;
        try {
            const res = await fetch(`${BACKEND_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                },
                // Add a small timeout or cache control if needed
                cache: 'no-store'
            });

            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else if (res.status === 401) {
                console.warn("Session expired or invalid token");
                logout();
            }
        } catch (error) {
            // Silently fail or show a minor warning instead of crashing
            console.error("Backend unreachable:", error);
        }
    };

    const checkSession = async () => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            await fetchUser(storedToken);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        fetchUser(newToken);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
