from fastapi import APIRouter, Depends
from app.services.auth import get_current_user
from app.models import NomineeAddRequest, NomineeAddSecureRequest

from app.services.database import add_nominee_to_db, add_nominee_secure_record

router = APIRouter(prefix="/nominee", tags=["Nominee"])

@router.post("/add")
def add_nominee(request: NomineeAddRequest, user_id: str = Depends(get_current_user)):
    """
    Adds a nominee for the authenticated user to Supabase PostgREST.
    """
    nominee_email = request.nominee_email
    
    # Insert effectively into Supabase via PostgREST
    add_nominee_to_db(user_id, nominee_email)
        
    return {
        "status": "success",
        "message": f"Nominee {nominee_email} added successfully.",
        "user_id": user_id
    }

@router.post("/generate-key")
def generate_nominee_key(request: NomineeAddSecureRequest, user_id: str = Depends(get_current_user)):
    """
    Generates a secure key for a nominee and returns the raw key ONCE.
    """
    from app.utils.key_generator import generate_secret_key
    from app.utils.crypto import hash_key
    from app.services.database import add_nominee_secure_record, get_vault_by_id
    from app.services.email_service import send_inheritor_key_email
    
    nominee_secret_key = generate_secret_key()
    nominee_secret_key_hash = hash_key(nominee_secret_key)
    
    add_nominee_secure_record(request.vault_id, request.nominee_email, nominee_secret_key_hash)
    
    # Send email to nominee
    vault = get_vault_by_id(request.vault_id)
    vault_code = vault.get("vault_code", "") if vault else ""
    send_inheritor_key_email(
        email=request.nominee_email,
        name=request.nominee_email.split("@")[0],
        role="Inheritor",
        secret_key=nominee_secret_key,
        vault_code=vault_code,
        threshold=1,
        total_keys=1
    )
    
    return {
        "status": "success",
        "nominee_secret_key": nominee_secret_key,
        "message": "Nominee added. Please securely share this key with the nominee. It will not be shown again."
    }
