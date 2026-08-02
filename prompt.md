# TRUSTIX — Master System Prompt & Technical Reference

> **What is this file for?**  
> `prompt.md` serves as the single source of truth context prompt for the **Trustix** system. It is designed to be fed directly into LLMs, AI coding assistants (like Gemini, Claude, or ChatGPT), new developers, or security auditors to immediately provide complete, accurate, and deep technical context about the Trustix architecture, security protocols, database schemas, API routes, and project structure.

---

# SYSTEM PROMPT: TRUSTIX (Zero-Knowledge Digital Inheritance & Asset Protection System)

## 1. Project Overview & Mission
**Trustix** is an AI-powered, zero-knowledge digital inheritance and asset protection platform. It solves the growing problem of unclaimed digital assets, unremembered cryptocurrency wallets, dispersed legal documents, and estate transfers upon an owner's death or prolonged inactivity ("Dead Man's Switch").

The platform guarantees that critical digital assets—such as legal wills, property deeds, crypto private keys, web3 custodial accounts, and stock portfolio metadata—remain end-to-end encrypted during the owner's lifetime and are securely transferred only to verified nominees under strict cryptographic and event-driven triggers.

---

## 2. Core Value Proposition & Use Cases

1. **Zero-Knowledge Asset Vault**: Sensitive user profile blobs and secrets are encrypted client-side or using AES-256-GCM before arriving at the server. Neither Trustix operators nor database administrators have access to raw vault contents.
2. **Automated Inactivity Triggers ("Dead Man's Switch")**: Configurable activity tracking monitors user check-ins. If a user is inactive past a threshold (e.g., 30, 90, or 180 days), automated nominee notification workflows initiate.
3. **Multi-Party Nominee Verification & Secret Sharing**: Vault access is controlled by owner-designated nominees holding unique, bcrypt-hashed secret keys and verification credentials.
4. **AI-Powered OCR Identity & Death Verification**: Automated optical character recognition (OCR) and fraud-detection models verify official legal documents (e.g., death certificates, legal heir affidavits) before releasing vault decryption keys.
5. **Web3 & TradFi Asset Aggregation**: Unifies Ethereum/EVM Web3 custodial and self-custodial wallets alongside traditional financial brokers like Zerodha (KiteConnect OAuth).

---

## 3. Technology Stack & Architecture

### Frontend (`/frontend`)
- **Core**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui component ecosystem
- **Icons & Animation**: Lucide Icons, Framer Motion
- **Auth & API Client**: `@supabase/supabase-js` for authentication and session management

### Backend (`/backend`)
- **Framework**: FastAPI (Python 3.11+) with Uvicorn ASGI server
- **Security & Cryptography**: `cryptography` library (AES-256-GCM), `bcrypt` key hashing, `PyJWT` for token validation
- **Financial Broker Integration**: `kiteconnect` SDK (Zerodha trading integration)
- **Document Processing**: Tesseract / EasyOCR / LLM-assisted verification engine

### Database & Storage Infrastructure
- **Database**: Supabase PostgreSQL with PostgREST, Row-Level Security (RLS) policies on all tables, and automated database triggers (`handle_new_user`, `update_updated_at_column`)
- **Cloud Storage**: Google Cloud Storage (GCS) storing binary AES-256 encrypted blobs (`.aes` files) with cryptographic proof hashes

---

## 4. Key Security Workflows & Cryptographic Model

### A. Zero-Knowledge Vault Setup
1. An owner creates a vault via `/vault/create` or `/zk-vault/init`.
2. The system generates a unique 10–12 character `vault_code` and a 32-character alphabetic `owner_secret_key`.
3. The raw secret key is displayed **once** to the user. The backend computes and stores a `bcrypt` hash of the key (`owner_secret_key_hash`).
4. Client-side encrypted payloads (`encrypted_blob`, `salt`, `iv`, `auth_tag`) are stored in `zero_knowledge_vaults` and `user_secure_profiles`.

### B. Encrypted Document Ingestion
1. The owner uploads a PDF document via `/documents/upload`.
2. The backend verifies file format (PDF) and size (<10MB), encrypts binary bytes with AES-256-GCM (`encrypt_pdf_bytes`), and constructs a storage path (`{vault_id}/{category}/{timestamp}-{uuid}.aes`).
3. Encrypted bytes are written to GCS, and metadata + initialization vector (`encryption_iv`) are recorded in Supabase `documents`.

### C. Nominee Onboarding & Release Protocol
1. The owner adds a nominee via `/vault/{vault_id}/nominees`.
2. The system auto-generates a unique secret key for the nominee and stores its `bcrypt` hash (`nominee_secret_key_hash`).
3. Release criteria can require OCR verification (`is_ocr_verified`) via `/verification/document`.
4. Verified nominees possessing valid keys can decrypt assigned vault contents upon trigger activation.

### D. Financial & Crypto Integrations
- **Web3 Wallets**: Links external public wallet addresses (`wallets`) and stores encrypted custodial private keys (`custodial_wallets`).
- **Zerodha Brokerage**: Authenticates via OAuth (KiteConnect), encrypts the access token (`zerodha_connections`), and aggregates live holdings/positions for dashboard display.

---

## 5. Database Schema (11 Core Tables)

All tables exist in the `public` schema in Supabase PostgreSQL (`backend/supabase_schema.sql`):

1. **`users`**: User profiles synchronized automatically from `auth.users` via database triggers.
2. **`vaults`**: Central vault records storing `vault_code`, `owner_secret_key_hash`, lock status, and failed attempt counters.
3. **`nominees`**: Nominees assigned to vaults, storing email, secret key hashes, trigger conditions, and OCR verification state.
4. **`wallets`**: External Web3 wallet addresses associated with users.
5. **`custodial_wallets`**: Encrypted private keys with initialization vectors (`iv`) and authentication tags (`auth_tag`).
6. **`zero_knowledge_vaults`**: Zero-Knowledge key-value store holding client-side encrypted payloads.
7. **`user_secure_profiles`**: Encrypted user secrets (`encrypted_blob`, `salt`, `iv`).
8. **`documents`**: Document metadata tracking GCS storage paths, category (`wills`, `legal_contracts`, `property_documents`, `other`), and `encryption_iv`.
9. **`user_activities`**: Immutable audit ledger recording system events (`user_id`, `vault_id`, `action`, `entity`, `type`).
10. **`user_settings`**: Compliance and organization preferences (GDPR, retention policies, legal terms).
11. **`zerodha_connections`**: Encrypted access tokens for Zerodha portfolio tracking.

---

## 6. Directory Structure

```
Trustix/
├── prompt.md                    # Master context prompt & technical documentation
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint & middleware setup
│   │   ├── config.py            # Environment settings & configuration loading
│   │   ├── models.py            # Pydantic schemas & request models
│   │   ├── middleware/          # Vault JWT authentication middleware
│   │   ├── routes/              # REST routes (vault, nominee, documents, wallet, etc.)
│   │   ├── services/            # Business logic (database, GCS, encryption, zerodha, OCR)
│   │   └── utils/               # Cryptographic utilities & key generators
│   ├── supabase_schema.sql      # Master PostgreSQL setup script for Supabase
│   ├── zk_vault_setup.sql       # Standalone ZK vault schema reference
│   └── requirements.txt         # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/          # Vault creation, nominee UI, layout components
│   │   ├── contexts/            # AuthContext (Supabase auth state)
│   │   ├── lib/                 # Supabase client initialization (`supabase.ts`)
│   │   ├── pages/               # Dashboard, Auth, Documents, Risk Monitoring, Settings
│   │   └── App.tsx              # React router setup
│   ├── package.json             # Frontend dependencies & scripts
│   └── tailwind.config.ts       # Design tokens & styling configuration
└── .gitignore                   # Git exclusion rules
```

---

## 7. Environment Variables Reference

### Backend (`backend/.env`):
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_JWT_SECRET`: JWT secret key for token signature verification.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for PostgREST admin DB operations.
- `GOOGLE_CLOUD_BUCKET`: GCS bucket name for binary encrypted file storage.
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to GCP Service Account JSON key.
- `ZERODHA_API_KEY` & `ZERODHA_API_SECRET`: KiteConnect broker credentials.
- `FRONTEND_URL`: CORS allowed origin.

### Frontend (`frontend/.env`):
- `VITE_SUPABASE_URL`: Public Supabase API URL.
- `VITE_SUPABASE_ANON_KEY`: Public Supabase anonymous API key.

---

## 8. Development Directives for AI & Developers

When working on this repository:
1. **Never Compromise Secrets**: Do not log unencrypted keys, plaintext passwords, or raw document payloads.
2. **Enforce Row Level Security (RLS)**: Ensure all new API endpoints filter by `user_id` or consume Supabase client with valid JWT context.
3. **Log Audit Events**: Any state-changing operation (uploading documents, adding nominees, changing settings) must register an activity in `user_activities`.
4. **Follow Clean Architecture**: Keep route definitions lightweight in `app/routes/`, moving complex logic into `app/services/`.
