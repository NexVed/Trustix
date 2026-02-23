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

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
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
                syncUserProfile(session);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                // Sync profile on sign-in or sign-up
                if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
                    await syncUserProfile(session);
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
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
