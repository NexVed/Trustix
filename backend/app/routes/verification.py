from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Query, Request, Form
from app.services.auth import get_current_user
from app.models import VaultAccessRequest
from app.services.ocr import extract_text_from_image
from app.services.verification import verify_document
from app.middleware.vault_auth import verify_vault_jwt
from app.services.database import get_nominees_by_vault_id, update_nominee_ocr_status
from app.services.gcs_service import gcs_service
import uuid
import datetime
import re

router = APIRouter(prefix="/verification", tags=["Verification"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}

@router.post("/document")
async def verify_uploaded_document(
    document_type: str = Query(..., pattern="^(death_certificate|id_proof)$"),
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Secure file drop endpoint for document verification via OCR.
    Processes the file in-memory and returns fraud analysis. 
    Does not store the file permanently or log sensitive contents.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are allowed.")

    file_bytes = await file.read()
    
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # OCR Extraction in memory
    extracted_text = extract_text_from_image(file_bytes)

    # Verification Logic
    result = verify_document(extracted_text, document_type)

    return {
        "user_id": user_id,
        "verification_result": result
    }

@router.post("/nominee-ocr")
async def verify_nominee_identity(
    nominee_email: str = Form(...),
    file: UploadFile = File(...),
    session: dict = Depends(verify_vault_jwt)
):
    """
    Identity verification endpoint for Nominees unlocking a Vault.
    Uploads ID to GCS, runs Google Vision OCR, and validates identity.
    Returns a newly signed JWT with is_ocr_verified=True on success.
    """
    import jwt
    from app.config import settings

    vault_id = session.get("vault_id")
    role = session.get("role")
    
    if not vault_id or role != "nominee":
        raise HTTPException(status_code=403, detail="Invalid session. Only nominees require OCR verification.")
        
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are allowed.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")
        
    # Verify the email is actually a nominee for this vault
    nominees = get_nominees_by_vault_id(vault_id)
    known_nominee = next((n for n in nominees if n["nominee_email"] == nominee_email), None)
    if not known_nominee:
        raise HTTPException(status_code=403, detail="The provided email is not a registered nominee for this vault.")
        
    # Upload to GCS
    timestamp = int(datetime.datetime.utcnow().timestamp())
    random_id = str(uuid.uuid4())[:8]
    ext = "jpg" if "jpeg" in file.content_type else "png"
    gcs_path = f"verification_ids/{vault_id}/{nominee_email}/{timestamp}-{random_id}.{ext}"
    
    try:
        gcs_url = gcs_service.upload_file(
            destination_blob_name=gcs_path, 
            file_bytes=file_bytes, 
            content_type=file.content_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage service unavailable: {e}")
        
    # Run Google Cloud Vision OCR
    extracted_text = extract_text_from_image(file_bytes)
    
    # Validation logic: fuzzy match name from email prefix
    name_hint = nominee_email.split("@")[0].replace(".", " ").lower()
    
    # Strip numbers out of the name hint
    name_hint = re.sub(r'\d+', '', name_hint).strip()
    
    # If a generic OCR match fails, clean up GCS and reject
    if len(name_hint) > 2 and name_hint not in extracted_text.lower():
        gcs_service.delete_file(gcs_path)
        raise HTTPException(status_code=400, detail=f"Identity Verification Failed: The name from email '{name_hint}' does not appear on the uploaded ID document.")
        
    # Mark as verified in PostgreSQL
    update_nominee_ocr_status(vault_id, nominee_email)
    
    # Issue a refreshed JWT with is_ocr_verified = True
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    token_payload = {
        "sub": session.get("sub"),
        "vault_id": vault_id,
        "role": "nominee",
        "is_ocr_verified": True,
        "nominee_email": nominee_email,
        "exp": exp
    }
    jwt_secret = settings.jwt_secret or "super-secret"
    token = jwt.encode(token_payload, jwt_secret, algorithm="HS256")
    
    return {
        "status": "success",
        "message": "Identity successfully verified via Google Cloud Vision API.",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 900
    }

@router.post("/vault-access")
async def verify_vault_access(request: VaultAccessRequest):
    """
    Verifies user vault access with vault code and secret key (or nominee keys).
    Locks vault after 5 failed attempts.
    """
    from app.services.database import get_vault_by_code, get_nominees_by_vault_id, increment_failed_attempts, reset_failed_attempts, lock_vault
    from app.utils.crypto import verify_key
    import jwt
    import datetime
    from app.config import settings
    
    vault = get_vault_by_code(request.vault_code)
    
    # Do not expose whether vault Code is invalid. Treat the same.
    if not vault:
        raise HTTPException(status_code=401, detail="Invalid vault code or credentials")
        
    if vault.get("is_locked"):
        raise HTTPException(status_code=403, detail="Vault is locked due to too many failed attempts")
        
    is_valid = False
    role = "owner"
    is_ocr_verified = True
    
    if request.secret_key:
        is_valid = verify_key(request.secret_key, vault.get("owner_secret_key_hash"))
        role = "owner"
        is_ocr_verified = True
    elif request.nominee_keys is not None:
        nominees = get_nominees_by_vault_id(vault["id"])
        if not nominees:
            is_valid = False
        elif len(request.nominee_keys) != len(nominees):
            is_valid = False
        else:
            role = "nominee"
            is_ocr_verified = False # Nominees must pass OCR to access documents
            # We must match each provided key to exactly one nominee hash
            matched_indices = set()
            is_valid = True
            for provided_key in request.nominee_keys:
                match_found = False
                for i, nominee in enumerate(nominees):
                    if i in matched_indices:
                        continue
                    if verify_key(provided_key, nominee["nominee_secret_key_hash"]):
                        matched_indices.add(i)
                        match_found = True
                        break
                if not match_found:
                    is_valid = False
                    break
    
    if not is_valid:
        failed_attempts = vault.get("failed_attempts", 0)
        if failed_attempts >= 4:
            lock_vault(vault["id"])
            raise HTTPException(status_code=403, detail="Vault is locked due to too many failed attempts")
        else:
            increment_failed_attempts(vault["id"], failed_attempts)
            raise HTTPException(status_code=401, detail="Invalid vault code or secret key")
            
    # Success, reset attempts
    reset_failed_attempts(vault["id"])
    
    # Create temporary JWT token
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    token_payload = {
        "sub": vault["user_id"],
        "vault_id": vault["id"],
        "role": role,
        "is_ocr_verified": is_ocr_verified,
        "exp": exp
    }
    jwt_secret = settings.jwt_secret or "super-secret"
    token = jwt.encode(token_payload, jwt_secret, algorithm="HS256")
    
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 900
    }
