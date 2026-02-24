import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, KeyRound, PlusCircle, ArrowRight } from 'lucide-react';

interface VaultPortalModalProps {
    isOpen: boolean;
    onClose?: () => void;
    onCreateVault: () => void;
    onAccessVault: () => void;
    preventClose?: boolean;
}

export default function VaultPortalModal({ isOpen, onClose, onCreateVault, onAccessVault, preventClose = false }: VaultPortalModalProps) {

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!preventClose && onClose ? onClose : undefined}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                        >
                            {/* Decorative background effects */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="text-center mb-8 relative z-10">
                                <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                                    <Shield className="w-8 h-8 text-blue-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome to Trustix Vault</h2>
                                <p className="text-zinc-400 max-w-md mx-auto">
                                    Your secure digital legacy starts here. Choose an option to proceed with your zero-knowledge vault.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                {/* Option 1: Create Vault */}
                                <button
                                    onClick={() => {
                                        if (onClose) onClose();
                                        onCreateVault();
                                    }}
                                    className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left hover:border-blue-500/50 hover:bg-zinc-800/50 transition-all duration-300 overflow-hidden flex flex-col items-start"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="mb-4 p-3 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                        <PlusCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">Create New Vault</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1">
                                        Generate a new secure vault with a unique identifier and cryptographic secret key.
                                    </p>
                                    <div className="flex items-center text-blue-400 font-medium text-sm mt-auto group-hover:translate-x-1 transition-transform">
                                        Setup Now <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </button>

                                {/* Option 2: Login / Access Vault */}
                                <button
                                    onClick={() => {
                                        if (onClose) onClose();
                                        onAccessVault();
                                    }}
                                    className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all duration-300 overflow-hidden flex flex-col items-start"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="mb-4 p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                        <KeyRound className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">Access Vault</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1">
                                        Already have a vault? Proceed to unlock it using your secure Vault Code and Secret Key.
                                    </p>
                                    <div className="flex items-center text-purple-400 font-medium text-sm mt-auto group-hover:translate-x-1 transition-transform">
                                        Login to Vault <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </button>
                            </div>

                            {!preventClose && onClose && (
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
