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


def upsert_user_profile(user_id: str, email: str, full_name: str = "", avatar_url: str = ""):
    client = get_supabase_client()
    try:
        data = {
            "id": user_id,
            "email": email,
            "full_name": full_name or None,
            "avatar_url": avatar_url or None,
            "last_sign_in_at": "now()",
        }
        response = client.table("users").upsert(
            data, on_conflict="id"
        ).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upsert user profile: {str(e)}")


def get_user_profile(user_id: str):
    client = get_supabase_client()
    try:
        response = client.table("users").select("*").eq("id", user_id).execute()
        if not response.data:
            return None
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user profile: {str(e)}")

def init_zk_vault(user_id: str, hashed_key: str):
    client = get_supabase_client()
    try:
        data = {
            "user_id": user_id,
            "hashed_key": hashed_key
        }
        response = client.table("zero_knowledge_vaults").insert(data).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize vault: {str(e)}")

def get_zk_vault(user_id: str):
    client = get_supabase_client()
    try:
        response = client.table("zero_knowledge_vaults").select("*").eq("user_id", user_id).execute()
        if not response.data:
            return None
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve vault: {str(e)}")

def update_zk_vault_data(user_id: str, encrypted_data: str, iv: str, auth_tag: str):
    client = get_supabase_client()
    try:
        data = {
            "encrypted_data": encrypted_data,
            "iv": iv,
            "auth_tag": auth_tag
        }
        response = client.table("zero_knowledge_vaults").update(data).eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update vault data: {str(e)}")

def create_vault_record(user_id: str, vault_code: str, owner_secret_key_hash: str):
    client = get_supabase_client()
    try:
        data = {
            "user_id": user_id,
            "vault_code": vault_code,
            "owner_secret_key_hash": owner_secret_key_hash
        }
        response = client.table("vaults").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create vault record: {str(e)}")

def add_nominee_secure_record(vault_id: str, nominee_email: str, nominee_secret_key_hash: str):
    client = get_supabase_client()
    try:
        data = {
            "vault_id": vault_id,
            "nominee_email": nominee_email,
            "nominee_secret_key_hash": nominee_secret_key_hash
        }
        response = client.table("nominees").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add secure nominee: {str(e)}")

def update_nominee_ocr_status(vault_id: str, nominee_email: str):
    client = get_supabase_client()
    try:
        response = client.table("nominees").update({"is_ocr_verified": True}).eq("vault_id", vault_id).eq("nominee_email", nominee_email).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update OCR verification status: {str(e)}")

def get_vault_by_code(vault_code: str):
    client = get_supabase_client()
    try:
        response = client.table("vaults").select("*").eq("vault_code", vault_code).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vault by code: {str(e)}")

def increment_failed_attempts(vault_id: str, current_attempts: int):
    client = get_supabase_client()
    try:
        data = {"failed_attempts": current_attempts + 1}
        response = client.table("vaults").update(data).eq("id", vault_id).execute()
        return response.data
    except Exception as e:
        pass

def reset_failed_attempts(vault_id: str):
    client = get_supabase_client()
    try:
        data = {"failed_attempts": 0}
        response = client.table("vaults").update(data).eq("id", vault_id).execute()
        return response.data
    except Exception as e:
        pass

def lock_vault(vault_id: str):
    client = get_supabase_client()
    try:
        data = {"is_locked": True}
        response = client.table("vaults").update(data).eq("id", vault_id).execute()
        return response.data
    except Exception as e:
        pass

def get_nominees_by_vault_id(vault_id: str):
    client = get_supabase_client()
    try:
        response = client.table("nominees").select("*").eq("vault_id", vault_id).execute()
        return response.data if response.data else []
    except Exception as e:
        return []

def link_wallet_to_user_db(user_id: str, wallet_address: str):
    client = get_supabase_client()
    try:
        data = {"wallet_address": wallet_address}
        response = client.table("users").update(data).eq("id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to link wallet: {str(e)}")

def store_encrypted_wallet_db(user_id: str, address: str, encrypted_key: str, iv: str, auth_tag: str):
    client = get_supabase_client()
    try:
        data = {
            "user_id": user_id,
            "wallet_address": address,
            "encrypted_private_key": encrypted_key,
            "iv": iv,
            "auth_tag": auth_tag
        }
        # Upsert custodial wallet record for user
        response = client.table("custodial_wallets").upsert(data, on_conflict="user_id").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store encrypted wallet: {str(e)}")

def get_custodial_wallet_db(user_id: str):
    client = get_supabase_client()
    try:
        response = client.table("custodial_wallets").select("*").eq("user_id", user_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch custodial wallet: {str(e)}")
