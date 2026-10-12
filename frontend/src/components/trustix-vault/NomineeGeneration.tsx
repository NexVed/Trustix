import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ShieldAlert, KeyRound, Copy, Check, Eye, EyeOff, AlertTriangle, AlertCircle, Trash2, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Nominee {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'revoked';
    dateAdded: string;
    secretKey: string;
}

export default function NomineeGeneration() {
    const [nominees, setNominees] = useState<Nominee[]>([
        {
            id: "1", name: "Sarah Jenkins", email: "sarah.j@example.com", status: 'active',
            dateAdded: "Feb 23, 2026", secretKey: "7f8a9b2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
        },
        {
            id: "2", name: "Michael Chang", email: "m.chang@example.com", status: 'revoked',
            dateAdded: "Jan 12, 2026", secretKey: "revoked_key_no_longer_valid"
        }
    ]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

    const handleCopy = (key: string, id: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const toggleReveal = (id: string) => {
        setRevealedKeys(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const generateNewNominee = async () => {
        if (!newName || !newEmail) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const { data: { session } } = await supabase.auth.getSession();

            // Decode Vault ID from the stored token
            const vaultToken = localStorage.getItem('trustix.vault.token');
            if (!vaultToken) {
                console.error("No vault token found. Cannot generate nominee for unknown vault.");
                return;
            }
            const payload = JSON.parse(atob(vaultToken.split('.')[1]));
            const activeVaultId = payload.vault_id;

            const response = await fetch(`${apiUrl}/nominee/generate-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ vault_id: activeVaultId, nominee_email: newEmail })
            });
            const data = await response.json();
            if (data.status === "success" && data.nominee_secret_key) {
                setGeneratedKey(data.nominee_secret_key);
            }
        } catch (e) {
            console.error("Failed to generate nominee key", e);
        }
    };

    const saveNewNominee = () => {
        if (!generatedKey || !newName || !newEmail) return;
        const newNom = {
            id: Date.now().toString(),
            name: newName,
            email: newEmail,
            status: 'active' as const,
            dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            secretKey: generatedKey
        };
        setNominees([newNom, ...nominees]);
        setIsAddModalOpen(false);
        setGeneratedKey(null);
        setNewName("");
        setNewEmail("");
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 sm:p-8">

            {/* HEADER SECTION */}
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        Assign Vault Nominees
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm sm:text-base">
                        Each nominee will receive a unique secret key.
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Nominee
                </button>
            </div>

            {/* NOMINEE LIST */}
            <div className="max-w-4xl mx-auto space-y-4">
                {nominees.map(nominee => (
                    <div key={nominee.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg 
                  ${nominee.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {nominee.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900">{nominee.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-slate-500">{nominee.email}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="text-xs font-medium text-slate-400">Added {nominee.dateAdded}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-start sm:self-auto">
                                {nominee.status === 'active' ? (
                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100 shadow-sm">Active</span>
                                ) : (
                                    <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-100 shadow-sm">Revoked</span>
                                )}
                            </div>
                        </div>

                        {/* Secret Key Section (only for active) */}
                        {nominee.status === 'active' && (
                            <div className="mt-5 pt-5 border-t border-slate-100">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                                    Nominee Action Center
                                </label>

                                <div className="flex flex-col lg:flex-row gap-4">

                                    {/* Key Display */}
                                    <div className="flex-1 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <KeyRound className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
                                        <div className="flex-1 overflow-x-auto scrollbar-hide">
                                            {revealedKeys.has(nominee.id) ? (
                                                <span className="font-mono text-sm text-slate-800 break-all select-all">{nominee.secretKey}</span>
                                            ) : (
                                                <span className="font-mono text-lg text-slate-400 tracking-[0.2em] leading-none mb-1 inline-block">••••••••••••••••••••••••••••••••</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                                            <button onClick={() => toggleReveal(nominee.id)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg">
                                                {revealedKeys.has(nominee.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => handleCopy(nominee.secretKey, nominee.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                {copiedKey === nominee.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-colors">
                                            <RefreshCw className="w-4 h-4 text-slate-400" />
                                            Regenerate
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors border border-red-100">
                                            <Trash2 className="w-4 h-4" />
                                            Revoke
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ADD NOMINEE MODAL */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
                        >
                            <button onClick={() => setIsAddModalOpen(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Add Nominee</h2>
                                    <p className="text-sm text-slate-500">Generate secure access</p>
                                </div>
                            </div>

                            {!generatedKey ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
                                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Nominee's full legal name" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email Address</label>
                                        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="nominee@example.com" />
                                    </div>

                                    <button
                                        onClick={generateNewNominee}
                                        disabled={!newName || !newEmail}
                                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        Generate Nominee Secret Key
                                    </button>
                                </div>
                            ) : (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                                            <Check className="w-5 h-5" /> Secret Key Generated Successfully
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">Nominee Secret Key</label>
                                        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div className="flex-1 overflow-x-hidden">
                                                <span className="font-mono text-sm text-slate-800 break-all select-all block h-auto">{generatedKey}</span>
                                            </div>
                                            <button onClick={() => handleCopy(generatedKey, 'new')} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg shrink-0 transition-colors">
                                                {copiedKey === 'new' ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-xl border border-red-100 text-sm font-medium">
                                        <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                                        <p>Provide this key securely. It cannot be retrieved later.</p>
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button onClick={() => { setIsAddModalOpen(false); setGeneratedKey(null); }} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all">
                                            Cancel
                                        </button>
                                        <button onClick={saveNewNominee} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-blue-600/20">
                                            Save Nominee
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
