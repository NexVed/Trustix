import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Users, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function VaultAccess({ onUnlocked }: { onUnlocked: (key: string) => void }) {
    const { session } = useAuth();
    const { toast } = useToast();

    // Step 1: Vault Identifier
    const [vaultCode, setVaultCode] = useState('');
    const [nomineeCount, setNomineeCount] = useState<number | null>(null);
    const [fetchingRequirements, setFetchingRequirements] = useState(false);

    // Step 2: Keys
    const [accessMethod, setAccessMethod] = useState<'owner' | 'nominees'>('owner');
    const [keyInput, setKeyInput] = useState('');
    const [nomineeKeys, setNomineeKeys] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFetchRequirements = async () => {
        if (!vaultCode.trim()) return;
        setFetchingRequirements(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/vault/${vaultCode}/requirements`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Vault not found or invalid identifier.');
            }

            const data = await response.json();
            setNomineeCount(data.nominee_count);

            // Initialize nominee keys array
            if (data.nominee_count > 0) {
                setNomineeKeys(Array(data.nominee_count).fill(''));
            } else {
                setAccessMethod('owner');
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setFetchingRequirements(false);
        }
    };

    const handleNomineeKeyChange = (index: number, value: string) => {
        const newKeys = [...nomineeKeys];
        newKeys[index] = value;
        setNomineeKeys(newKeys);
    };

    const handleUnlock = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = { vault_code: vaultCode };

            if (accessMethod === 'owner') {
                if (!keyInput.trim()) throw new Error("Owner secret key is required.");
                payload.secret_key = keyInput;
            } else {
                if (nomineeKeys.some(k => !k.trim())) throw new Error("All nominee keys are required.");
                payload.nominee_keys = nomineeKeys;
            }

            const response = await fetch(`${apiUrl}/verification/vault-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Too many attempts. Please try again later.');
                }
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Invalid credentials or keys provided.');
            }

            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('trustix.vault.token', data.access_token);
            }

            toast({ title: 'Vault Unlocked', description: 'Your session is active in memory.' });

            // Unlocked with owner key or first nominee key (as a reference key for the frontend)
            onUnlocked(accessMethod === 'owner' ? keyInput : nomineeKeys[0]);
        } catch (err: unknown) {
            console.error(err);
            toast({ title: 'Access Denied', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-2xl bg-white shadow-sm mt-8 max-w-lg mx-auto w-full">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Unlock Your Vault</h2>

            <AnimatePresence mode="wait">
                {nomineeCount === null ? (
                    <motion.div
                        key="step-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full flex flex-col items-center"
                    >
                        <p className="mb-6 max-w-sm text-center text-slate-500 text-sm">
                            Enter your Vault Identifier to begin securely accessing your sealed assets.
                        </p>
                        <div className="flex flex-col w-full max-w-sm space-y-4">
                            <Input
                                type="text"
                                placeholder="Vault Identifier (e.g. TRX-ABCD-1234)"
                                value={vaultCode}
                                onChange={(e) => setVaultCode(e.target.value.toUpperCase())}
                                className="font-mono text-center uppercase h-12 tracking-wider"
                            />
                            <Button
                                onClick={handleFetchRequirements}
                                disabled={fetchingRequirements || !vaultCode.trim()}
                                className="w-full h-12 font-medium"
                            >
                                {fetchingRequirements ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="step-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full flex flex-col items-center"
                    >
                        {nomineeCount > 0 ? (
                            <div className="w-full mb-6 mt-2">
                                <div className="flex p-1 bg-slate-100 rounded-lg">
                                    <button
                                        onClick={() => setAccessMethod('owner')}
                                        className={`flex-1 flex justify-center items-center py-2 text-sm font-medium rounded-md transition-all ${accessMethod === 'owner' ? 'bg-white shadow shadow-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        <KeyRound className="w-4 h-4 mr-2" />
                                        Owner Access
                                    </button>
                                    <button
                                        onClick={() => setAccessMethod('nominees')}
                                        className={`flex-1 flex justify-center items-center py-2 text-sm font-medium rounded-md transition-all ${accessMethod === 'nominees' ? 'bg-white shadow shadow-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Nominee Access
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="mb-6 max-w-sm text-center text-slate-500 text-sm">
                                Enter the Owner Secret Key for vault <span className="font-mono text-slate-900">{vaultCode}</span>
                            </p>
                        )}

                        <div className="flex flex-col w-full max-w-sm space-y-4">
                            {accessMethod === 'owner' ? (
                                <Input
                                    type="password"
                                    placeholder="Enter Owner Secret Key"
                                    value={keyInput}
                                    onChange={(e) => setKeyInput(e.target.value)}
                                    className="font-mono text-sm w-full h-11"
                                />
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-center text-info mb-2 font-medium">
                                        This vault requires all {nomineeCount} nominee designated keys to unlock.
                                    </p>
                                    {nomineeKeys.map((key, index) => (
                                        <div key={index} className="relative">
                                            <Input
                                                type="password"
                                                placeholder={`Nominee Key ${index + 1}`}
                                                value={key}
                                                onChange={(e) => handleNomineeKeyChange(index, e.target.value)}
                                                className="font-mono text-sm w-full h-11 pl-10"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">
                                                #{index + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-2 flex flex-col gap-3">
                                <Button
                                    onClick={handleUnlock}
                                    disabled={loading}
                                    className="w-full h-11 font-medium bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock Vault'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => { setNomineeCount(null); setKeyInput(''); setNomineeKeys([]); }}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
