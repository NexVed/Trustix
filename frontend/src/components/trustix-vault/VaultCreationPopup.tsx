import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Eye, EyeOff, AlertTriangle, Download, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VaultCreationPopup({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [revealSecret, setRevealSecret] = useState(false);
    const [understood, setUnderstood] = useState(false);

    const [vaultCode, setVaultCode] = useState("Generating...");
    const [secretKey, setSecretKey] = useState("Generating...");
    const [generated, setGenerated] = useState(false);

    useEffect(() => {
        if (isOpen && !generated) {
            const generateVault = async () => {
                try {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                    const { data: { session } } = await supabase.auth.getSession();
                    const response = await fetch(`${apiUrl}/vault/create`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`
                        }
                    });
                    const data = await response.json();
                    if (data.status === "success") {
                        setVaultCode(data.vault_code);
                        setSecretKey(data.owner_secret_key);
                        setGenerated(true);
                    }
                } catch (e) {
                    console.error("Failed to generate vault", e);
                }
            };
            generateVault();
        }
    }, [isOpen, generated]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(vaultCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secretKey);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">

                    {/* Backdrop Blur Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 sm:px-8 border-b border-slate-100 flex flex-col items-center text-center bg-slate-50/50">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                                <ShieldCheck className="w-6 h-6 stroke-[2]" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Autonomous Vault Key Generated</h2>
                            <p className="text-sm text-slate-500 mt-2 max-w-sm">This key gives you permanent control of your vault.</p>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto">

                            {/* SECTION 1: Vault Unique Code */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-slate-400" />
                                    Vault Identifier
                                </label>
                                <div className="relative group">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className="font-mono text-lg font-medium tracking-wider text-slate-800">{vaultCode}</span>
                                        <button
                                            onClick={handleCopyCode}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative"
                                        >
                                            {copiedCode ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}

                                            {/* Tooltip */}
                                            {copiedCode && (
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                                                    Copied!
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">Use this code to identify your vault when logging in.</p>
                            </div>

                            {/* SECTION 2: Owner Secret Key */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-900 flex items-center justify-between">
                                    <span>Owner Secret Key</span>
                                </label>

                                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl group focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                                    <div className="flex-1 overflow-x-auto scrollbar-hide">
                                        {revealSecret ? (
                                            <span className="font-mono text-sm break-all text-slate-800 leading-relaxed px-1">
                                                {secretKey}
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-1 font-mono text-xl text-slate-400 tracking-widest px-1 py-1">
                                                ••••••••••••••••••••••••••••••••••••••••••••
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2 shrink-0">
                                        <button
                                            onClick={() => setRevealSecret(!revealSecret)}
                                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                            title={revealSecret ? "Hide key" : "Reveal key"}
                                        >
                                            {revealSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={handleCopySecret}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
                                            title="Copy key"
                                        >
                                            {copiedSecret ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                            {copiedSecret && (
                                                <div className="absolute -top-10 right-0 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 z-10">
                                                    Copied!
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 sm:p-4 bg-red-50 text-red-800 rounded-xl border border-red-100">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                                    <p className="text-sm font-medium leading-relaxed">
                                        This key cannot be recovered by Trustix. If you lose it, you will lose permanent access to your vault. Store it securely.
                                    </p>
                                </div>
                            </div>

                            {/* SECTION 3: Backup Options */}
                            <div className="pt-4 border-t border-slate-100 space-y-5">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all">
                                        <Download className="w-4 h-4 text-slate-400" />
                                        <span>Download Backup PDF</span>
                                    </button>
                                </div>

                                <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group">
                                    <div className="relative flex items-center shrink-0 mt-0.5">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={understood}
                                            onChange={(e) => setUnderstood(e.target.checked)}
                                        />
                                    </div>
                                    <span className="text-sm text-slate-700 font-medium select-none group-hover:text-slate-900 transition-colors">
                                        I understand this key cannot be recovered if lost, and I have stored it safely.
                                    </span>
                                </label>

                                <button
                                    disabled={!understood}
                                    onClick={onClose}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold transition-all shadow-sm ${understood
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-lg hover:-translate-y-0.5'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        }`}
                                >
                                    <span>Access My Vault</span>
                                    <ArrowRight className="w-5 h-5 opacity-80" />
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
