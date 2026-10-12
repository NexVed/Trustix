import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LockIcon } from 'lucide-react';

export default function VaultDashboard({ encryptionKey, onLock }: { encryptionKey: string, onLock: () => void }) {
    const { session } = useAuth();
    const { toast } = useToast();
    const [data, setData] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchVaultData = async () => {
            if (!session) return;
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/zk-vault/data/retrieve`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ key: encryptionKey })
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result.data || '');
                } else {
                    toast({ title: 'Error', description: 'Failed to decrypt data.', variant: 'destructive' });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVaultData();
    }, [encryptionKey, session, toast]);

    const handleSave = async () => {
        if (!session) return;
        setSaving(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/zk-vault/data`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ key: encryptionKey, data })
            });

            if (!response.ok) throw new Error('Failed to save encrypted data');
            toast({ title: 'Saved', description: 'Vault data securely encrypted and stored.' });
        } catch (err) {
            console.error(err);
            toast({ title: 'Error', description: 'Failed to save data.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-8">Decrypting Vault...</div>;

    return (
        <div className="w-full flex flex-col h-[70vh] border border-border/50 rounded-lg p-6 bg-white dark:bg-black/30 shadow-sm mt-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <LockIcon className="text-green-500 w-5 h-5" /> Active Vault
                </h2>
                <Button variant="outline" size="sm" onClick={onLock}>Lock Vault</Button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
                Any text you enter below is encrypted with AES-256-GCM using your secure key.
                Only the ciphertext and Authentication Tag are saved on our servers.
            </p>

            <Textarea
                className="flex-1 font-mono resize-none p-4"
                placeholder="Type your highly sensitive secrets here... (e.g. Master passwords, Seed Phrases, private keys)"
                value={data}
                onChange={(e) => setData(e.target.value)}
            />

            <div className="mt-4 flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? 'Encrypting & Saving...' : 'Save Securely'}
                </Button>
            </div>
        </div>
    );
}
