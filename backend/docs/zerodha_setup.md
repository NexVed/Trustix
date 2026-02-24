# Run this SQL snippet in your Supabase SQL Editor to support the Zerodha Kit Connect Auth

```sql
CREATE TABLE IF NOT EXISTS public.zerodha_connections (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    zerodha_user_id TEXT NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Enable RLS
ALTER TABLE public.zerodha_connections ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update their own connections
CREATE POLICY "Users can manage their own connection"
    ON public.zerodha_connections
    FOR ALL
    USING (auth.uid() = user_id);
```
