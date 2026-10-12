from fastapi import APIRouter, Depends, HTTPException
from app.services.auth import get_current_user
from app.services.database import get_supabase_client
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/settings", tags=["Settings"])


class OrgSettings(BaseModel):
    org_name: Optional[str] = None
    org_registration: Optional[str] = None
    org_address: Optional[str] = None
    org_jurisdiction: Optional[str] = None
    primary_contact: Optional[str] = None
    contact_email: Optional[str] = None
    encryption_standard: Optional[str] = None
    key_derivation: Optional[str] = None
    key_rotation_days: Optional[int] = None
    primary_region: Optional[str] = None
    backup_region: Optional[str] = None
    gdpr_enabled: Optional[bool] = None
    retention_policy: Optional[str] = None
    legal_tos: Optional[str] = None
    legal_inheritance: Optional[str] = None


@router.get("")
async def get_settings(user_id: str = Depends(get_current_user)):
    """Get user/org settings."""
    client = get_supabase_client()
    try:
        response = client.table("user_settings").select("*").eq("user_id", user_id).execute()
        if response.data:
            return response.data[0]

        # Return defaults if no settings exist
        return {
            "user_id": user_id,
            "org_name": "",
            "org_registration": "",
            "org_address": "",
            "org_jurisdiction": "",
            "primary_contact": "",
            "contact_email": "",
            "encryption_standard": "aes256",
            "key_derivation": "argon2",
            "key_rotation_days": 90,
            "primary_region": "us-east",
            "backup_region": "eu-west",
            "gdpr_enabled": True,
            "retention_policy": "7years",
            "legal_tos": "",
            "legal_inheritance": "",
        }
    except Exception:
        return {"user_id": user_id}


@router.put("")
async def update_settings(body: OrgSettings, user_id: str = Depends(get_current_user)):
    """Update user/org settings."""
    client = get_supabase_client()
    try:
        data = {k: v for k, v in body.dict().items() if v is not None}
        data["user_id"] = user_id

        response = client.table("user_settings").upsert(data, on_conflict="user_id").execute()
        return {"status": "success", "settings": response.data[0] if response.data else data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {str(e)}")
