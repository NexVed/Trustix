import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from "@/components/DashboardLayout";
import VaultInit from '@/components/vault/VaultInit';
import ZkVaultAccess from '@/components/vault/ZkVaultAccess';
import VaultDashboard from '@/components/vault/VaultDashboard';
import { ShieldAlert } from 'lucide-react';

export default function ZkVaultPage() {
    const { session } = useAuth();
    const location = useLocation();

    // Check if we came from the dashboard popup with a key already unlocked
    const initialKey = location.state?.encryptionKey || null;

    const [status, setStatus] = useState<'loading' | 'uninitialized' | 'locked' | 'unlocked'>(initialKey ? 'unlocked' : 'loading');
    const [encryptionKey, setEncryptionKey] = useState<string | null>(initialKey);

    useEffect(() => {
        const checkStatus = async () => {
            if (!session) return;
            if (initialKey) return; // already unlocked, skip check
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/zk-vault/status`, {
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.initialized) {
                        setStatus('locked');
                    } else {
                        setStatus('uninitialized');
                    }
                } else {
                    setStatus('uninitialized');
                }
            } catch (err) {
                console.error(err);
                setStatus('locked'); // Default to locked on error to be safe
            }
        };
        checkStatus();
    }, [session]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h1 className="page-title">ZK Vault</h1>
                            <p className="page-subtitle">True Zero-Knowledge Secret Storage</p>
                        </div>
                    </div>
                </div>

                <div>
                    {status === 'loading' && <div className="p-12 text-center text-muted-foreground animate-pulse">Establishing secure connection...</div>}
                    {status === 'uninitialized' && <VaultInit onInitialized={() => setStatus('locked')} />}
                    {status === 'locked' && <ZkVaultAccess onUnlocked={(key) => { setEncryptionKey(key); setStatus('unlocked'); }} />}
                    {status === 'unlocked' && encryptionKey && <VaultDashboard encryptionKey={encryptionKey} onLock={() => { setEncryptionKey(null); setStatus('locked'); }} />}
                </div>
            </div>
        </DashboardLayout>
    );
}
