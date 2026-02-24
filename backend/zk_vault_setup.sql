-- Create zero_knowledge_vaults table
CREATE TABLE zero_knowledge_vaults (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hashed_key TEXT NOT NULL,
    encrypted_data TEXT,
    iv TEXT,
    auth_tag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE zero_knowledge_vaults ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and update their own zk vault
CREATE POLICY "Users can view own zk vault" ON zero_knowledge_vaults
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own zk vault" ON zero_knowledge_vaults
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own zk vault" ON zero_knowledge_vaults
    FOR UPDATE USING (auth.uid() = user_id);
