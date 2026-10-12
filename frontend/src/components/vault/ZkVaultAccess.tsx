import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function ZkVaultAccess({ onUnlocked }: { onUnlocked: (key: string) => void }) {
    const { session } = useAuth();
    const { toast } = useToast();
    const [keyInput, setKeyInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUnlock = async () => {
        if (!keyInput.trim()) return;
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/zk-vault/verify`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ key: keyInput })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Invalid Zero-Knowledge Vault key.');
            }

            toast({ title: 'ZK Vault Unlocked', description: 'Your secure payload has been decrypted in memory.' });
            onUnlocked(keyInput);
        } catch (err) {
            console.error(err);
            toast({ title: 'Access Denied', description: err instanceof Error ? err.message : 'Unable to unlock the vault.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-2xl bg-white shadow-sm mt-8 max-w-lg mx-auto w-full">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Unlock ZK Vault</h2>
            <p className="mb-6 max-w-sm text-center text-slate-500 text-sm">
                Enter your secure 64-character encryption key to decrypt your vault.
            </p>

            <div className="flex flex-col w-full max-w-sm space-y-4">
                <Input
                    type="password"
                    placeholder="Enter Zero-Knowledge Key"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="font-mono text-center h-12"
                />
                <Button
                    onClick={handleUnlock}
                    disabled={loading || !keyInput.trim()}
                    className="w-full h-12 font-medium"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>Decrypt & Open <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                </Button>
            </div>
        </div>
    );
}
