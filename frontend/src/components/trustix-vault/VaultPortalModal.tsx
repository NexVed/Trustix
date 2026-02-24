import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, KeyRound, PlusCircle, ArrowRight, X } from 'lucide-react';

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
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-slate-900/10 relative overflow-hidden"
                        >
                            {/* Decorative top accent */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="text-center mb-8 relative z-10">
                                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
                                    <Shield className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome to Trustix Vault</h2>
                                <p className="text-slate-500 max-w-md mx-auto">
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
                                    className="group relative bg-slate-50 border border-slate-200 rounded-xl p-6 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 overflow-hidden flex flex-col items-start"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="mb-4 p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                        <PlusCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Create New Vault</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                        Generate a new secure vault with a unique identifier and cryptographic secret key.
                                    </p>
                                    <div className="flex items-center text-blue-600 font-medium text-sm mt-auto group-hover:translate-x-1 transition-transform">
                                        Setup Now <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </button>

                                {/* Option 2: Login / Access Vault */}
                                <button
                                    onClick={() => {
                                        if (onClose) onClose();
                                        onAccessVault();
                                    }}
                                    className="group relative bg-slate-50 border border-slate-200 rounded-xl p-6 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 overflow-hidden flex flex-col items-start"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="mb-4 p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                        <KeyRound className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Access Vault</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                                        Already have a vault? Proceed to unlock it using your secure Vault Code and Secret Key.
                                    </p>
                                    <div className="flex items-center text-blue-600 font-medium text-sm mt-auto group-hover:translate-x-1 transition-transform">
                                        Login to Vault <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </button>
                            </div>

                            {!preventClose && onClose && (
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
