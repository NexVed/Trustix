import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ethers, BrowserProvider } from 'ethers';
import { useAuth } from '@/contexts/AuthContext';

interface SignMessageProps {
    apiBaseUrl?: string; // e.g. http://localhost:8000
}

export const SignMessage: React.FC<SignMessageProps> = ({ apiBaseUrl = "http://localhost:8000" }) => {
    const [message, setMessage] = useState('Trustix Vault Verification Request');
    const [isSigning, setIsSigning] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [signature, setSignature] = useState<string | null>(null);
    const [verificationResult, setVerificationResult] = useState<'idle' | 'success' | 'failed'>('idle');
    const { session } = useAuth();
    const { toast } = useToast();

    const handleSign = async () => {
        if (!window.ethereum) {
            toast({
                title: "MetaMask not found",
                description: "Please install the MetaMask extension to sign messages.",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsSigning(true);

            // Connect to the injected ethereum provider (v6 syntax)
            const provider = new BrowserProvider(window.ethereum);

            // Request account access if not already granted
            await provider.send("eth_requestAccounts", []);

            // Get the signer (the user's wallet)
            const signer = await provider.getSigner();

            // Sign the message
            const sig = await signer.signMessage(message);
            setSignature(sig);
            setVerificationResult('idle');

            toast({
                title: "Message Signed",
                description: "Your cryptographically secure signature was generated successfully.",
            });

        } catch (error: any) {
            console.error("Signing error:", error);
            toast({
                title: "Signing Failed",
                description: error.message || "User denied message signature.",
                variant: "destructive"
            });
        } finally {
            setIsSigning(false);
        }
    };

    const handleVerify = async () => {
        if (!signature) return;

        try {
            setIsVerifying(true);

            // Send the signature and the original message to the backend
            const response = await fetch(`${apiBaseUrl}/wallet/verify-signature`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`, // Authenticated endpoint
                },
                body: JSON.stringify({
                    message: message,
                    signature: signature
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Verification failed");
            }

            setVerificationResult('success');
            toast({
                title: "Verification Successful",
                description: "The backend confirmed the signature matches your stored custodial wallet.",
            });

        } catch (error: any) {
            setVerificationResult('failed');
            toast({
                title: "Verification Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-sm text-white mt-4">
            <h3 className="text-xl font-semibold mb-2">Cryptographic Signature</h3>
            <p className="text-sm text-slate-400 mb-6">
                Sign a custom payload using your private key to verify identity to the Trustix backend without exposing secrets.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                        Message Payload
                    </label>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-slate-800 border-slate-700 border text-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 transition"
                    />
                </div>

                <button
                    onClick={handleSign}
                    disabled={isSigning || !message}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition font-medium flex items-center justify-center space-x-2"
                >
                    {isSigning ? "Awaiting Signature..." : "Sign Message with Wallet"}
                </button>

                {signature && (
                    <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Generated Signature</p>
                        <p className="font-mono text-xs break-all text-slate-300 mb-4 bg-slate-900 p-2 rounded">
                            {signature}
                        </p>

                        <button
                            onClick={handleVerify}
                            disabled={isVerifying}
                            className={`w-full py-2 rounded-lg transition font-medium text-sm flex items-center justify-center ${verificationResult === 'success' ? 'bg-green-600/20 text-green-400 border border-green-600/50' :
                                    verificationResult === 'failed' ? 'bg-red-600/20 text-red-400 border border-red-600/50' :
                                        'bg-slate-700 hover:bg-slate-600 text-white'
                                }`}
                        >
                            {isVerifying ? "Verifying with server..." :
                                verificationResult === 'success' ? "Signature Verified ✓" :
                                    "Verify Signature on Backend"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
