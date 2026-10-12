"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface VaultState {
    vaultId: string | null;
    vaultCode: string | null;
    role: 'owner' | 'nominee' | null;
    isOcrVerified: boolean;
    token: string | null;
}

interface VaultContextType extends VaultState {
    setVaultToken: (token: string) => void;
    clearVault: () => void;
}

const VAULT_TOKEN_KEY = 'trustix.vault.token';

const VaultContext = createContext<VaultContextType>({
    vaultId: null,
    vaultCode: null,
    role: null,
    isOcrVerified: false,
    token: null,
    setVaultToken: () => { },
    clearVault: () => { },
});

function decodeVaultToken(token: string): Partial<VaultState> {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            vaultId: payload.vault_id || null,
            vaultCode: payload.vault_code || null,
            role: payload.role || 'owner',
            isOcrVerified: payload.is_ocr_verified !== false,
            token,
        };
    } catch {
        return { vaultId: null, vaultCode: null, role: null, isOcrVerified: false, token: null };
    }
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<VaultState>({
        vaultId: null,
        vaultCode: null,
        role: null,
        isOcrVerified: false,
        token: null,
    });

    // Load from localStorage on mount
    useEffect(() => {
        const existingToken = localStorage.getItem(VAULT_TOKEN_KEY);
        if (existingToken) {
            setState((prev) => ({ ...prev, ...decodeVaultToken(existingToken) }));
        }
    }, []);

    // Listen for storage events (cross-tab sync)
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === VAULT_TOKEN_KEY) {
                if (e.newValue) {
                    setState((prev) => ({ ...prev, ...decodeVaultToken(e.newValue!) }));
                } else {
                    setState({ vaultId: null, vaultCode: null, role: null, isOcrVerified: false, token: null });
                }
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const setVaultToken = useCallback((token: string) => {
        localStorage.setItem(VAULT_TOKEN_KEY, token);
        setState((prev) => ({ ...prev, ...decodeVaultToken(token) }));
    }, []);

    const clearVault = useCallback(() => {
        localStorage.removeItem(VAULT_TOKEN_KEY);
        setState({ vaultId: null, vaultCode: null, role: null, isOcrVerified: false, token: null });
    }, []);

    return (
        <VaultContext.Provider value={{ ...state, setVaultToken, clearVault }}>
            {children}
        </VaultContext.Provider>
    );
}

export function useVault() {
    return useContext(VaultContext);
}
