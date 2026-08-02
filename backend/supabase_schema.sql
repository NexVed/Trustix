-- ==============================================================================
-- Trustix Database Setup Schema for Supabase PostgreSQL
-- Run this entire script in your Supabase SQL Editor to set up all tables, 
-- indexes, triggers, auto-user sync, and Row-Level Security (RLS) policies.
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- Function: Auto-update `updated_at` timestamp on row modifications
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. USERS TABLE (Extends auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    wallet_address TEXT,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
    ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE USING (auth.uid() = id);

DROP TRIGGER IF EXISTS tr_users_updated_at ON public.users;
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically insert a row into public.users when a user signs up via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, last_sign_in_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        last_sign_in_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 2. VAULTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_code TEXT UNIQUE,
    owner_secret_key_hash TEXT,
    file_url TEXT,
    blockchain_hash TEXT,
    failed_attempts INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vaults_user_id ON public.vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_vaults_vault_code ON public.vaults(vault_code);

ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vaults" 
    ON public.vaults FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vaults" 
    ON public.vaults FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vaults" 
    ON public.vaults FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vaults" 
    ON public.vaults FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS tr_vaults_updated_at ON public.vaults;
CREATE TRIGGER tr_vaults_updated_at
    BEFORE UPDATE ON public.vaults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- 3. NOMINEES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nominees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID REFERENCES public.vaults(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    nominee_email TEXT NOT NULL,
    nominee_secret_key_hash TEXT,
    verification_level TEXT DEFAULT 'Level 1 — Basic',
    trigger_condition TEXT DEFAULT '180-day inactivity',
    legal_approval TEXT DEFAULT 'Pending Review',
    is_ocr_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nominees_vault_id ON public.nominees(vault_id);
CREATE INDEX IF NOT EXISTS idx_nominees_user_id ON public.nominees(user_id);
CREATE INDEX IF NOT EXISTS idx_nominees_email ON public.nominees(nominee_email);

ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vault owners can manage nominees"
    ON public.nominees FOR ALL USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.vaults 
            WHERE public.vaults.id = public.nominees.vault_id 
            AND public.vaults.user_id = auth.uid()
        )
    );

DROP TRIGGER IF EXISTS tr_nominees_updated_at ON public.nominees;
CREATE TRIGGER tr_nominees_updated_at
    BEFORE UPDATE ON public.nominees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- 4. WALLETS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wallets" 
    ON public.wallets FOR ALL USING (auth.uid() = user_id);


-- ==============================================================================
-- 5. CUSTODIAL WALLETS TABLE (Encrypted Private Keys)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.custodial_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_custodial_wallets_user_id ON public.custodial_wallets(user_id);

ALTER TABLE public.custodial_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custodial wallet" 
    ON public.custodial_wallets FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS tr_custodial_wallets_updated_at ON public.custodial_wallets;
CREATE TRIGGER tr_custodial_wallets_updated_at
    BEFORE UPDATE ON public.custodial_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- 6. ZERO KNOWLEDGE VAULTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.zero_knowledge_vaults (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hashed_key TEXT NOT NULL,
    encrypted_data TEXT,
    iv TEXT,
    auth_tag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.zero_knowledge_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own zk vault" 
    ON public.zero_knowledge_vaults FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own zk vault" 
    ON public.zero_knowledge_vaults FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own zk vault" 
    ON public.zero_knowledge_vaults FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS tr_zk_vaults_updated_at ON public.zero_knowledge_vaults;
CREATE TRIGGER tr_zk_vaults_updated_at
    BEFORE UPDATE ON public.zero_knowledge_vaults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- 7. USER SECURE PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_secure_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_blob TEXT NOT NULL,
    salt TEXT NOT NULL,
    iv TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_secure_profiles_user_id ON public.user_secure_profiles(user_id);

ALTER TABLE public.user_secure_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own secure profile" 
    ON public.user_secure_profiles FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS tr_user_secure_profiles_updated_at ON public.user_secure_profiles;
CREATE TRIGGER tr_user_secure_profiles_updated_at
    BEFORE UPDATE ON public.user_secure_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- 8. DOCUMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    category TEXT NOT NULL,
    gcs_path TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_vault_id ON public.documents(vault_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vault owners and authorized users can access documents" 
    ON public.documents FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.vaults 
            WHERE public.vaults.id = public.documents.vault_id 
            AND public.vaults.user_id = auth.uid()
        )
    );


-- ==============================================================================
-- 9. USER ACTIVITIES TABLE (Audit Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_id UUID REFERENCES public.vaults(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    type TEXT DEFAULT 'Success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own activities" 
    ON public.user_activities FOR ALL USING (auth.uid() = user_id);


-- ==============================================================================
-- 10. USER SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_name TEXT DEFAULT '',
    org_registration TEXT DEFAULT '',
    org_address TEXT DEFAULT '',
    org_jurisdiction TEXT DEFAULT '',
    primary_contact TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    encryption_standard TEXT DEFAULT 'aes256',
    key_derivation TEXT DEFAULT 'argon2',
    key_rotation_days INTEGER DEFAULT 90,
    primary_region TEXT DEFAULT 'us-east',
    backup_region TEXT DEFAULT 'eu-west',
    gdpr_enabled BOOLEAN DEFAULT TRUE,
    retention_policy TEXT DEFAULT '7years',
    legal_tos TEXT DEFAULT '',
    legal_inheritance TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" 
    ON public.user_settings FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS tr_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER tr_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- 11. ZERODHA CONNECTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.zerodha_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    zerodha_user_id TEXT,
    encrypted_access_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zerodha_connections_user_id ON public.zerodha_connections(user_id);

ALTER TABLE public.zerodha_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Zerodha connection" 
    ON public.zerodha_connections FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS tr_zerodha_connections_updated_at ON public.zerodha_connections;
CREATE TRIGGER tr_zerodha_connections_updated_at
    BEFORE UPDATE ON public.zerodha_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
