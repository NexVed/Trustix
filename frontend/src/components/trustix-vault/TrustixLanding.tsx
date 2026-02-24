import React from 'react';
import { motion } from 'framer-motion';
import { Shield, KeyRound, ArrowRight } from 'lucide-react';

export default function TrustixLanding() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden font-sans text-slate-900">
            {/* Background Soft Blue Gradient Accent */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50/80 via-white to-white pointer-events-none" />
            <div className="absolute -top-[500px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full bg-blue-100/40 blur-3xl opacity-50 z-0 pointer-events-none" />

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center text-center"
            >
                <div className="mb-6 h-16 w-16 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    <Shield className="w-8 h-8 stroke-[1.5]" />
                </div>

                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 mb-4">
                    Trustix Vault
                </h1>

                <p className="text-lg text-slate-500 mb-10 max-w-md">
                    Secure. Nominee-Protected. Zero-Knowledge Access.
                </p>

                <div className="w-full bg-white border border-slate-200 shadow-xl shadow-slate-200/20 rounded-2xl p-8 space-y-4">
                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-sm group">
                        <KeyRound className="w-5 h-5 opacity-80" />
                        <span>Login to Existing Vault</span>
                        <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    <button className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-medium py-3 px-6 rounded-xl transition-all">
                        <span>Create Your Own Vault</span>
                    </button>
                </div>

                <p className="mt-8 text-sm text-slate-400 font-medium">
                    Your vault is protected by private secret keys.
                </p>
            </motion.div>
        </div>
    );
}
