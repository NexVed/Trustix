import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

interface GenerateWalletProps {
    apiBaseUrl?: string;
}

export const GenerateWallet: React.FC<GenerateWalletProps> = ({ apiBaseUrl = "http://localhost:8000" }) => {
    const [password, setPassword] = useState('');
    const [generatedAddress, setGeneratedAddress] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { session } = useAuth();
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!password || password.length < 8) {
            toast({
                title: "Weak Password",
                description: "Please provide a strong master password (at least 8 characters) to encrypt your new wallet.",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsGenerating(true);

            // 1. Generate a random wallet locally (Never log the private key)
            const randomWallet = ethers.Wallet.createRandom();
            const address = randomWallet.address;
            const rawPrivateKey = randomWallet.privateKey;

            // 2. Send over HTTPS to backend for AES-256-GCM encryption using PBKDF2 derivation
            const response = await fetch(`${apiBaseUrl}/wallet/store`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`, // Authenticated endpoint
                },
                body: JSON.stringify({
                    private_key: rawPrivateKey,
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to secure wallet on server.");
            }

            setGeneratedAddress(address);
            setPassword(''); // clear the password immediately from state

            toast({
                title: "Wallet Secured",
                description: "A new Ethereum wallet was generated and encrypted securely in the vault.",
            });

        } catch (error: any) {
            console.error("Wallet generation error:", error);
            toast({
                title: "Generation Failed",
                description: error.message || "An unknown error occurred while securing the wallet.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
            <div className="flex items-center space-x-2 mb-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <h3 className="text-xl font-semibold text-slate-900">Custodial Web3 Vault</h3>
            </div>

            <p className="text-sm text-slate-500 mb-4">
                Don't have a wallet? We can generate a random Ethereum wallet for you.
                Your raw private key is <strong>never</strong> stored in plaintext. It is immediately encrypted using AES-256-GCM derived from your vault password.
            </p>

            {generatedAddress ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-green-700 mb-1">Vault Wallet Active</h4>
                        <p className="font-mono text-xs text-slate-700 break-all">{generatedAddress}</p>
                        <p className="text-xs text-slate-500 mt-2">
                            The encrypted key is stored safely on the server. You can now receive assets to this address.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                            <KeyRound className="h-3 w-3 mr-1" /> Master Vault Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 8 characters for PBKDF2 derivation"
                            className="w-full bg-slate-50 border-slate-200 border text-slate-900 rounded-lg p-3 outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || password.length < 8}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition font-medium flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/10"
                    >
                        {isGenerating ? "Encrypting Key in Vault..." : "Generate Secure Wallet"}
                    </button>
                </div>
            )}
        </div>
    );
};
