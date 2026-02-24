import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

// Important: Extend the Window interface to recognize the `ethereum` object injected by MetaMask
declare global {
    interface Window {
        ethereum?: any;
    }
}

export const ConnectWallet: React.FC = () => {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const { toast } = useToast();

    const connectMetaMask = async () => {
        if (!window.ethereum) {
            toast({
                title: "MetaMask not found",
                description: "Please install the MetaMask browser extension to use this feature.",
                variant: "destructive"
            });
            return;
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
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-sm text-white">
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-slate-400 mb-6">
                Link your non-custodial wallet (like MetaMask) to securely sign messages and manage assets.
                We will only request your public address.
            </p>

            {walletAddress ? (
                <div className="flex flex-col space-y-4">
                    <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-between border border-slate-700">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Connected Address</p>
                            <p className="font-mono text-sm text-green-400">{walletAddress}</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <button
                        onClick={disconnectWallet}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-sm font-medium"
                    >
                        Disconnect Wallet
                    </button>
                </div>
            ) : (
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
            )}
        </div>
    );
};
