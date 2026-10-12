import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmptyState, PageHeader, PanelHeading } from "@/components/WorkspacePage";
import VaultInit from '@/components/vault/VaultInit';
import ZkVaultAccess from '@/components/vault/ZkVaultAccess';
import VaultDashboard from '@/components/vault/VaultDashboard';
import { ShieldAlert, KeyRound, LockKeyhole, LogOut } from 'lucide-react';

export default function ZkVaultPage() {
    const { session } = useAuth();
    // The vault key stays in component state; a route change always starts locked.
    const initialKey = null;

    const [status, setStatus] = useState<'loading' | 'uninitialized' | 'locked' | 'unlocked'>(initialKey ? 'unlocked' : 'loading');
    const [encryptionKey, setEncryptionKey] = useState<string | null>(initialKey);

    useEffect(() => {
        const checkStatus = async () => {
            if (!session) return;
            if (initialKey) return; // already unlocked, skip check
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
            <div className="ws-page">
                <PageHeader section="Protection" title="Private vault" description="Your sensitive records, protected with your vault key." />
                <div className="ws-two-column">
                <section className="card-enterprise ws-private-tool">
                    <PanelHeading title="Vault access" description="Private storage" action={<span className="badge-encrypted"><LockKeyhole size={12} />{session && status === 'unlocked' ? 'Unlocked' : 'Locked'}</span>} />

                {!session ? <EmptyState icon={LockKeyhole} title="Your private vault is locked" description="An authenticated account is required to initialize or unlock this vault." /> : <div className="ws-private-content">
                    {status === 'loading' && <div className="p-12 text-center text-muted-foreground animate-pulse">Establishing secure connection...</div>}
                    {status === 'uninitialized' && <VaultInit onInitialized={() => setStatus('locked')} />}
                    {status === 'locked' && <ZkVaultAccess onUnlocked={(key) => { setEncryptionKey(key); setStatus('unlocked'); }} />}
                    {status === 'unlocked' && encryptionKey && <VaultDashboard encryptionKey={encryptionKey} onLock={() => { setEncryptionKey(null); setStatus('locked'); }} />}
                </div>}
                </section>
                <aside className="card-enterprise">
                    <PanelHeading title="Access & recovery" />
                    <div className="ws-detail-list">
                        <div className="ws-detail-row"><KeyRound size={18} /><div><strong>Vault key</strong><small>Required to access your private records.</small></div></div>
                        <div className="ws-detail-row"><ShieldAlert size={18} /><div><strong>Recovery</strong><small>Keep a secure backup of your key. Lost keys cannot be recovered.</small></div></div>
                        <div className="ws-detail-row"><LogOut size={18} /><div><strong>Session lock</strong><small>Your vault locks when you leave this page.</small></div></div>
                    </div>
                </aside>
                </div>
            </div>
        </DashboardLayout>
    );
}
