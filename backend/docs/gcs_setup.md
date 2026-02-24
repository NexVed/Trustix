# Google Cloud Setup Guide & Supabase Database Schema

## Step 1: Google Cloud Setup

Follow these steps to configure Google Cloud Storage for the secure vault:

1. **Create Google Cloud Project:**
   Go to the [Google Cloud Console](https://console.cloud.google.com/), click the project dropdown, and create a new project named `Trustix-Vault`.

2. **Enable Cloud Storage API:**
   Navigate to **APIs & Services > Library**, search for "Cloud Storage API", and enable it for your project.

3. **Create Private Bucket (Uniform Access):**
   - Go to **Cloud Storage > Buckets** and click **Create**.
   - Name your bucket (e.g., `trustix-secure-vault-bucket`).
   - Choose a Region close to your users.
   - Under **Access control**, select **Uniform** to ensure IAM policies apply uniformly.
   - Uncheck "Enforce public access prevention on this bucket" if it restricts service accounts, but ideally keep **Enforce Public Access Prevention** enabled to guarantee the bucket is entirely private.

4. **Disable Public Access:**
   Ensure there are no "allUsers" or "allAuthenticatedUsers" permissions. The bucket should only be accessible by your service account.

5. **Create Service Account:**
   - Go to **IAM & Admin > Service Accounts** and click **Create Service Account**.
   - Name it `trustix-storage-sa`.
   - Grant it the **Storage Object Admin** role.

6. **Generate JSON Credentials:**
   - Click on the created service account, go to **Keys > Add Key > Create new key**.
   - Select **JSON** and download the file.

7. **Store Securely in `.env`:**

```env
# Google Cloud Storage Configuration
GCP_PROJECT_ID="your-gcp-project-id"
GCP_BUCKET_NAME="trustix-secure-vault-bucket"
GCP_CLIENT_EMAIL="trustix-storage-sa@your-gcp-project-id.iam.gserviceaccount.com"
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv... (replace actual newlines with \n) ...\n-----END PRIVATE KEY-----\n"
```

## Step 2: Supabase Database Schema

Execute this SQL safely via the Supabase SQL Editor:

```sql
-- Create the documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID REFERENCES public.vaults(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('wills', 'legal_contracts', 'property_documents', 'other')),
    gcs_path TEXT NOT NULL,
    uploaded_by TEXT NOT NULL, -- Email of the user who uploaded it
    encryption_iv TEXT NOT NULL, -- Initial Vector used for AES-256
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Service Role Policy (The backend service can do everything)
CREATE POLICY "Service Role Full Access to Documents"
ON public.documents
FOR ALL
USING (auth.uid() IS NULL);

-- User Read/Delete (Optional, if users query directly via frontend, though currently handled by Backend)
-- Here we'll configure it assuming the backend handles validation, so backend ignores RLS with service_role.
```
