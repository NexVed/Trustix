import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
};

// Helper functions for cookie management
const setAuthCookie = (token: string, expiresInSeconds: number) => {
    // Calculate expiration date
    const date = new Date();
    date.setTime(date.getTime() + (expiresInSeconds * 1000));
    const expires = "; expires=" + date.toUTCString();

    // Set cookie on root path
    document.cookie = "sb-access-token=" + token + expires + "; path=/; SameSite=Lax";
};

const clearAuthCookie = () => {
    document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;";
};

/**
 * Syncs the user profile to the public.users table via the FastAPI backend.
 * Falls back silently if the backend is unavailable.
 */
async function syncUserProfile(session: Session) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    try {
        await fetch(`${apiUrl}/auth/signup-sync`, {
            method: 'POST',
            credentials: 'include', // Ensure cookies are sent properly
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                avatar_url: session.user.user_metadata?.avatar_url || '',
            }),
        });
    } catch (err) {
        console.warn('User profile sync failed (backend may be offline):', err);
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Sync on initial load if session exists
            if (session) {
                setAuthCookie(session.access_token, session.expires_in ?? 3600);
                syncUserProfile(session);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                if (session) {
                    setAuthCookie(session.access_token, session.expires_in ?? 3600);
                }

                // Sync profile on sign-in or sign-up
                if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
                    await syncUserProfile(session);
                } else if (event === 'SIGNED_OUT') {
                    clearAuthCookie();
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        clearAuthCookie();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
