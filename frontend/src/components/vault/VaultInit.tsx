import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { CopyIcon } from 'lucide-react';

export default function VaultInit({ onInitialized }: { onInitialized: () => void }) {
    const { session } = useAuth();
    const { toast } = useToast();
    const [key, setKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const generateKey = () => {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        const newKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        setKey(newKey);
    };

    const copyToClipboard = () => {
        if (key) {
            navigator.clipboard.writeText(key);
            toast({ title: 'Key copied to clipboard', description: 'Store this in a secure password manager.' });
        }
    };

    const handleConfirm = async () => {
        if (!key || !session) return;
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/zk-vault/init`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ key })
            });
            if (!response.ok) {
                throw new Error('Failed to initialize vault');
            }
            toast({ title: 'Success', description: 'Zero-Knowledge Vault initialized successfully.' });
            onInitialized();
        } catch (err) {
            console.error(err);
            toast({ title: 'Error', description: 'Could not initialize vault.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Initialize Zero-Knowledge Vault</h2>
            <p className="mb-6 max-w-md text-gray-500">
                To ensure absolute privacy, your data will be encrypted with a key that is never stored on our servers.
                Only you will have the key. If you lose it, your vault data is unrecoverable.
            </p>

            {!key ? (
                <Button onClick={generateKey}>Generate Secure Key</Button>
            ) : (
                <div className="flex flex-col items-center space-y-4">
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono flex items-center gap-2 text-sm break-all max-w-md">
                        {key}
                        <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                            <CopyIcon className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-red-500 font-semibold max-w-md text-sm">
                        Warning: We do not store this key. You must save it in a password manager right now. You will never see this key again.
                    </div>
                    <Button onClick={handleConfirm} disabled={loading} className="w-full">
                        {loading ? 'Initializing...' : 'I have safely stored this key'}
                    </Button>
                </div>
            )}
        </div>
    );
}
