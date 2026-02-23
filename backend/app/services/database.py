from supabase import create_client, Client
from app.config import settings
from fastapi import HTTPException

# Initialize Supabase client for database operations (using service role to bypass RLS for internal operations, or perform backend admin tasks)
def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=500, detail="Supabase service role key or URL not configured.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

def save_vault_metadata(user_id: str, file_url: str, blockchain_hash: str):
    client = get_supabase_client()
    try:
        data = {
            "user_id": user_id,
            "file_url": file_url,
            "blockchain_hash": blockchain_hash
        }
        # Upsert vault data assuming 1 vault per user, or insert a new record
        response = client.table("vaults").upsert(data).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save vault metadata: {str(e)}")

def add_nominee_to_db(user_id: str, nominee_email: str):
    client = get_supabase_client()
    try:
        data = {
            "user_id": user_id,
            "nominee_email": nominee_email
        }
        # Insert nominee
        response = client.table("nominees").insert(data).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add nominee: {str(e)}")

def link_wallet_to_user_db(user_id: str, wallet_address: str):
    client = get_supabase_client()
    try:
        data = {
            "user_id": user_id,
            "wallet_address": wallet_address
        }
        # Upsert user wallet info
        response = client.table("wallets").upsert(data).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to link wallet: {str(e)}")

def save_secure_profile(user_id: str, encrypted_blob: str, salt: str, iv: str):
    client = get_supabase_client()
    try:
        data = {
            "user_id": user_id,
            "encrypted_blob": encrypted_blob,
            "salt": salt,
            "iv": iv
        }
        # Upsert user secure profile (on duplicate user_id, update)
        response = client.table("user_secure_profiles").upsert(
            data, on_conflict="user_id"
        ).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save secure profile: {str(e)}")

def get_secure_profile(user_id: str):
    client = get_supabase_client()
    try:
        response = client.table("user_secure_profiles").select("encrypted_blob, salt, iv").eq("user_id", user_id).execute()
        if not response.data:
            return None
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve secure profile: {str(e)}")
