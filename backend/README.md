# TRUSTIX Backend MVP

This is the FASTAPI backend for TRUSTIX, an AI-powered digital inheritance vault.

## Environment Variables

See `.env.example` for required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_JWT_SECRET`: The JWT Secret from your Supabase API settings (used to verify but NOT sign)
- `SUPABASE_SERVICE_ROLE_KEY`: The Service Role Key from your Supabase API settings (used for PostgREST database operations bypassing RLS)
- `GOOGLE_CLOUD_BUCKET`: The GCS bucket name for storing encrypted files
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to the service account JSON file for authenticating with Google Cloud Storage
- `FRONTEND_URL`: Hosted URL of your Vercel React frontend (for CORS restriction)

## Local Setup

1. Create a virtual environment and activate it:
```bash
python -m venv venv
.\venv\Scripts\activate   # On Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your `.env` file based on `.env.example`.

4. Start the server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 10000 --reload
```

## Render Deployment Instructions

1. Connect your GitHub repository containing this `backend` folder to Render.
2. Create a new **Web Service**.
3. Set the **Build Command** to: `pip install -r requirements.txt`
4. Set the **Start Command** to: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. In the Render Dashboard, add the following Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_JWT_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLOUD_BUCKET`
   - `GOOGLE_APPLICATION_CREDENTIALS` (If your service account JSON cannot be a file on Render, you may need to map the JSON contents to a variable or use a Render Secret File that matches this path.)
   - `FRONTEND_URL`

## API Testing with cURL

Make sure to replace `YOUR_SUPABASE_JWT` with a valid JWT retrieved from your Superbase Auth frontend test.

### 1. Upload Encrypted Vault Data
```bash
curl -X POST "http://localhost:10000/vault/upload" \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -F "file=@your_encrypted_backup.bin"
```
Expects: `file_url`, `blockchain_hash`, `user_id`

### 2. Add Nominee
```bash
curl -X POST "http://localhost:10000/nominee/add" \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "Content-Type: application/json" \
     -d '{"nominee_email": "trustee@example.com"}'
```
Expects: confirmation message

### 3. Check Dead-Man Trigger
```bash
curl -X POST "http://localhost:10000/trigger/check" \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "Content-Type: application/json" \
     -d '{"last_active_days": 31}'
```
Expects: `{"status": "trigger_activated"}` or `{"status": "user_active"}`

### 4. Link MetaMask Wallet
```bash
curl -X POST "http://localhost:10000/wallet/link" \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "Content-Type: application/json" \
     -d '{"wallet_address": "0xYourEthereumAddress", "signature": "0xYourSignatureString"}'
```
Expects: confirmation message (signature is optional for MVP)

### 5. Document Verification (OCR)
```bash
curl -X POST "http://localhost:10000/verification/document?document_type=death_certificate" \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -F "file=@your_certificate.png"
```
Expects: `{"user_id": "...", "verification_result": {"status": "approved" | "flagged" | "rejected", "fraud_score": ..., "extracted_data": {...}}}`

### 6. Store Encrypted Profile
```bash
curl -X POST "http://localhost:10000/profile/store" \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     -H "Content-Type: application/json" \
     -d '{"encrypted_blob": "e2ee_base64_data", "salt": "random_salt", "iv": "random_iv"}'
```
Expects: `{"status": "success", "message": "Secure profile stored successfully."}`

### 7. Retrieve Encrypted Profile
```bash
curl -X GET "http://localhost:10000/profile/me" \
     -H "Authorization: Bearer YOUR_SUPABASE_JWT"
```
Expects: `{"encrypted_blob": "e2ee_base64_data", "salt": "random_salt", "iv": "random_iv"}`
