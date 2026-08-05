from supabase import create_client, Client
from app.config import settings
from fastapi import HTTPException
from typing import Optional, List, Dict, Any
import json

# Initialize Supabase client for database operations (using service role to bypass RLS for internal operations)
def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=500, detail="Supabase service role key or URL not configured.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


# ============================================================
# VAULT FUNCTIONS (No user authentication - vault-based access)
# ============================================================

def create_vault(
    vault_code: str,
    threshold: int,
    inheritors: List[Dict[str, Any]],
    owner_secret_key_hash: str
) -> Optional[Dict]:
    """
    Create a new vault with threshold and inheritors.
    inheritors: List of {name, role, secret_key_hash}
    """
    client = get_supabase_client()
    try:
        vault_data = {
            "vault_code": vault_code,
            "threshold": threshold,
            "owner_secret_key_hash": owner_secret_key_hash,
            "is_locked": False,
            "failed_attempts": 0
        }
        response = client.table("vaults").insert(vault_data).execute()
        if not response.data:
            return None
        
        vault = response.data[0]
        vault_id = vault["id"]
        
        # Add inheritors
        for inheritor in inheritors:
            client.table("vault_inheritors").insert({
                "vault_id": vault_id,
                "name": inheritor["name"],
                "role": inheritor["role"],
                "secret_key_hash": inheritor["secret_key_hash"]
            }).execute()
        
        return vault
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create vault: {str(e)}")


def get_vault_by_code(vault_code: str) -> Optional[Dict]:
    """Get vault by code."""
    client = get_supabase_client()
    try:
        response = client.table("vaults").select("*").eq("vault_code", vault_code).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vault: {str(e)}")


def get_vault_by_id(vault_id: str) -> Optional[Dict]:
    """Get vault by ID."""
    client = get_supabase_client()
    try:
        response = client.table("vaults").select("*").eq("id", vault_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vault: {str(e)}")


def get_vault_inheritors(vault_id: str) -> List[Dict]:
    """Get all inheritors for a vault."""
    client = get_supabase_client()
    try:
        response = client.table("vault_inheritors").select("*").eq("vault_id", vault_id).execute()
        return response.data if response.data else []
    except Exception as e:
        return []


def get_vault_inheritors_with_keys(vault_id: str) -> List[Dict]:
    """Get inheritors with their secret key hashes (for vault creation response)."""
    client = get_supabase_client()
    try:
        response = client.table("vault_inheritors").select("id, name, role, secret_key_hash").eq("vault_id", vault_id).execute()
        return response.data if response.data else []
    except Exception as e:
        return []


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


# ============================================================
# DOCUMENT FUNCTIONS
# ============================================================

def save_document_metadata(vault_id: str, file_name: str, category: str, gcs_path: str, encryption_iv: str) -> Optional[Dict]:
    """Save document metadata to vault_documents table."""
    client = get_supabase_client()
    try:
        data = {
            "vault_id": vault_id,
            "file_name": file_name,
            "category": category,
            "gcs_path": gcs_path,
            "encryption_iv": encryption_iv
        }
        response = client.table("vault_documents").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")


def get_vault_documents(vault_id: str, category: Optional[str] = None) -> List[Dict]:
    """Get all documents for a vault."""
    client = get_supabase_client()
    try:
        query = client.table("vault_documents").select("*").eq("vault_id", vault_id)
        if category:
            query = query.eq("category", category)
        response = query.order("created_at", desc=True).execute()
        return response.data if response.data else []
    except Exception as e:
        return []


def get_document_by_id(vault_id: str, document_id: str) -> Optional[Dict]:
    """Get specific document."""
    client = get_supabase_client()
    try:
        response = client.table("vault_documents").select("*").eq("id", document_id).eq("vault_id", vault_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        return None


def delete_document(vault_id: str, document_id: str) -> bool:
    """Delete document metadata."""
    client = get_supabase_client()
    try:
        client.table("vault_documents").delete().eq("id", document_id).eq("vault_id", vault_id).execute()
        return True
    except Exception as e:
        return False


# ============================================================
# ORIGINAL DOCUMENT REFERENCES (for forgery detection)
# ============================================================

def save_original_document_reference(vault_id: str, document_data: dict) -> Optional[Dict]:
    """Save original document reference with OCR text and hash."""
    client = get_supabase_client()
    try:
        data = {"vault_id": vault_id, **document_data}
        response = client.table("vault_document_references").insert(data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save document reference: {str(e)}")


def get_vault_original_documents(vault_id: str, document_type: Optional[str] = None) -> List[Dict]:
    """Get preserved original documents for a vault."""
    client = get_supabase_client()
    try:
        query = client.table("vault_document_references").select("*").eq("vault_id", vault_id)
        if document_type:
            query = query.eq("document_type", document_type)
        response = query.order("created_at", desc=True).execute()
        return response.data if response.data else []
    except Exception as e:
        return []


def get_original_document_by_id(vault_id: str, document_id: str) -> Optional[Dict]:
    """Get specific original document reference."""
    client = get_supabase_client()
    try:
        response = client.table("vault_document_references").select("*").eq("id", document_id).eq("vault_id", vault_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        return None


# ============================================================
# ACTIVITY LOGGING
# ============================================================

def log_activity(vault_id: str, action: str, entity: str, type: str = "Success", details: Optional[Dict] = None):
    """Log activity for audit trail."""
    client = get_supabase_client()
    try:
        data = {
            "vault_id": vault_id,
            "action": action,
            "entity": entity,
            "type": type,
            "details": details
        }
        client.table("vault_activities").insert(data).execute()
    except Exception as e:
        pass  # Silent fail for logging


def get_vault_activities(vault_id: str, limit: int = 50) -> List[Dict]:
    """Get activity log for vault."""
    client = get_supabase_client()
    try:
        response = client.table("vault_activities").select("*").eq("vault_id", vault_id).order("created_at", desc=True).limit(limit).execute()
        return response.data if response.data else []
    except Exception as e:
        return []


# ============================================================
# VAULT STATUS / DASHBOARD
# ============================================================

def get_vault_summary(vault_id: str) -> Optional[Dict]:
    """Get vault summary for dashboard."""
    client = get_supabase_client()
    try:
        # Get vault
        vault_resp = client.table("vaults").select("*").eq("id", vault_id).execute()
        if not vault_resp.data:
            return None
        vault = vault_resp.data[0]
        
        # Get inheritors
        inheritors = get_vault_inheritors(vault_id)
        
        # Get document counts
        docs_resp = client.table("vault_documents").select("category", count="exact").eq("vault_id", vault_id).execute()
        
        return {
            "vault": vault,
            "inheritors": inheritors,
            "document_count": docs_resp.count or 0,
            "threshold": vault.get("threshold", 1)
        }
    except Exception as e:
        return None


# ============================================================
# EMAIL HELPER FUNCTIONS
# ============================================================

def get_user_email(user_id: str) -> Optional[str]:
    """Get user email from auth.users or profiles table."""
    client = get_supabase_client()
    try:
        # Try to get from auth.users via service role
        response = client.auth.admin.get_user_by_id(user_id)
        if response.user and response.user.email:
            return response.user.email
    except Exception:
        pass
    try:
        # Fallback: check profiles table
        response = client.table("profiles").select("email").eq("id", user_id).execute()
        if response.data:
            return response.data[0].get("email")
    except Exception:
        pass
    return None


def get_nominee_emails(vault_id: str) -> List[str]:
    """Get all nominee emails for a vault."""
    client = get_supabase_client()
    try:
        response = client.table("vault_inheritors").select("email").eq("vault_id", vault_id).execute()
        return [n["email"] for n in response.data if n.get("email")]
    except Exception:
        return []


def get_vaults_for_trigger_check() -> List[Dict]:
    """Get vaults that need trigger checking (not triggered, has last_activity_at)."""
    client = get_supabase_client()
    try:
        response = client.table("vaults").select("*").eq("is_triggered", False).not_.is_("last_activity_at", "null").execute()
        return response.data if response.data else []
    except Exception:
        return []


def mark_vault_triggered(vault_id: str) -> bool:
    """Mark vault as triggered."""
    client = get_supabase_client()
    try:
        from datetime import datetime
        client.table("vaults").update({
            "is_triggered": True,
            "triggered_at": datetime.utcnow().isoformat()
        }).eq("id", vault_id).execute()
        return True
    except Exception:
        return False


def log_trigger_activation(vault_id: str):
    """Log trigger activation for audit trail."""
    log_activity(vault_id, "trigger_activated", "vault", "Success", {"reason": "dead_man_switch"})