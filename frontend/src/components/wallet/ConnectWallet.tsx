import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Important: Extend the Window interface to recognize the `ethereum` object injected by MetaMask
declare global {
    interface Window {
        ethereum?: any;
    }
}

/**
 * Waits for MetaMask to inject `window.ethereum`.
 * MetaMask's content script may load asynchronously, so a direct check
 * on page load can fail. This polls briefly or listens for the standard event.
 */
async function waitForEthereum(timeoutMs = 3000): Promise<boolean> {
    if (window.ethereum) return true;

    return new Promise((resolve) => {
        // Modern MetaMask dispatches this event
        const handler = () => {
            window.removeEventListener('ethereum#initialized', handler);
            resolve(true);
        };
        window.addEventListener('ethereum#initialized', handler);

        // EIP-6963 provider announcement (newer standard)
        const eip6963Handler = () => {
            window.removeEventListener('eip6963:announceProvider', eip6963Handler);
            resolve(true);
        };
        window.addEventListener('eip6963:announceProvider', eip6963Handler);

        // Polling fallback — MetaMask may inject without an event
        const interval = setInterval(() => {
            if (window.ethereum) {
                clearInterval(interval);
                resolve(true);
            }
        }, 100);

        // Timeout — give up after timeoutMs
        setTimeout(() => {
            clearInterval(interval);
            window.removeEventListener('ethereum#initialized', handler);
            window.removeEventListener('eip6963:announceProvider', eip6963Handler);
            resolve(!!window.ethereum);
        }, timeoutMs);
    });
}

export const ConnectWallet: React.FC = () => {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState<boolean | null>(null);
    const { toast } = useToast();

    // Detect MetaMask on mount with waiting
    useEffect(() => {
        waitForEthereum().then((available) => {
            setIsMetaMaskAvailable(available);
        });
    }, []);

    const connectMetaMask = async () => {
        // If we haven't checked yet, wait for it now
        if (!window.ethereum) {
            const available = await waitForEthereum(2000);
            if (!available) {
                toast({
                    title: "MetaMask not found",
                    description: "Please install the MetaMask browser extension to use this feature.",
                    variant: "destructive"
                });
                return;
            }
        }

        try {
            setIsConnecting(true);
            // Request account access if needed
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            if (accounts && accounts.length > 0) {
                setWalletAddress(accounts[0]);
                toast({
                    title: "Wallet Connected",
                    description: `Successfully connected to: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
                });

                // At this point, you could also send the public address to the backend 
                // to link the non-custodial wallet to the user's profile.
            }
        } catch (error: any) {
            console.error("MetaMask connection error:", error);
            toast({
                title: "Connection Failed",
                description: error.message || "Failed to connect to MetaMask.",
                variant: "destructive"
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setWalletAddress(null);
        toast({
            title: "Wallet Disconnected",
            description: "You have disconnected your MetaMask wallet from this session."
        });
    };

    return (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-semibold mb-2 text-slate-900">Connect Your Wallet</h3>
            <p className="text-sm text-slate-500 mb-6">
                Link your non-custodial wallet (like MetaMask) to securely sign messages and manage assets.
                We will only request your public address.
            </p>

            {walletAddress ? (
                <div className="flex flex-col space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between border border-slate-200">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Connected Address</p>
                            <p className="font-mono text-sm text-green-600">{walletAddress}</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <button
                        onClick={disconnectWallet}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium"
                    >
                        Disconnect Wallet
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {isMetaMaskAvailable === false && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs">
                            MetaMask not detected. Make sure the extension is installed and this page is loaded on <code className="bg-slate-800 px-1 rounded">http://localhost</code>.
                        </div>
                    )}
                    <button
                        onClick={connectMetaMask}
                        disabled={isConnecting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition font-medium flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/20"
                    >
                        {isConnecting ? (
                            <span className="flex items-center">
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
                                Connecting...
                            </span>
                        ) : (
                            <span>Connect MetaMask</span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
