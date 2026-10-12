from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Query, Form
from starlette.concurrency import run_in_threadpool
from app.services.auth import get_current_user
from app.services.ocr import (
    extract_text_from_image,
    extract_document,
    get_ocr_status,
    detect_forgery,
    verify_document_structure,
    get_document_hash
)
from app.middleware.vault_auth import verify_vault_jwt
from app.services.database import get_vault_by_id, get_vault_documents, save_document_reference
from app.services.gcs_service import gcs_service
import uuid
import datetime

router = APIRouter(prefix="/verification", tags=["Verification"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "application/pdf"}


@router.get("/ocr/status")
async def ocr_status(user_id: str = Depends(get_current_user)):
    return await run_in_threadpool(get_ocr_status)


@router.post("/ocr")
async def extract_document_text(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """Extract document content without saving it or making an identity decision."""
    try:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(415, "Choose a PDF, PNG, or JPEG document.")
        data = await file.read(MAX_FILE_SIZE + 1)
        result = await run_in_threadpool(extract_document, data)
        return {**result, "word_count": len(result["text"].split()), "text_length": len(result["text"])}
    finally:
        await file.close()


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
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and PDF are allowed.")

    file_bytes = await file.read()
    
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    # OCR Extraction in memory
    extracted_text = await run_in_threadpool(extract_text_from_image, file_bytes)

    # Verification Logic - structure validation
    structure_result = verify_document_structure(extracted_text, document_type)

    return {
        "user_id": user_id,
        "verification_result": structure_result,
        "extracted_text_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
    }


@router.post("/document/compare")
async def compare_document_with_original(
    vault_id: str = Form(...),
    document_id: str = Form(...),  # Reference to the original preserved document
    file: UploadFile = File(...),
    session: dict = Depends(verify_vault_jwt)
):
    """
    Compare an uploaded document against the original preserved document in the vault.
    Returns forgery detection analysis with similarity scoring.
    """
    # Verify vault access
    vault_session_vault_id = session.get("vault_id")
    if vault_session_vault_id != vault_id:
        raise HTTPException(status_code=403, detail="Access denied to this vault")
    
    role = session.get("role")
    if role not in ["owner", "nominee"]:
        raise HTTPException(status_code=403, detail="Only vault owner or nominees can compare documents")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and PDF are allowed.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    # Get original document from vault
       # This would fetch the original document reference from the vault
    # For now, we'll simulate fetching the original text from storage
    # In production, this would retrieve the original document text from GCS or database
    original_doc = get_vault_documents(vault_id)
    original_doc_ref = next((d for d in original_doc if d.get("id") == document_id), None)
    
    if not original_doc_ref:
        raise HTTPException(status_code=404, detail="Original document not found in vault")

    # Get original document text (from stored OCR result or re-process original)
    original_text = original_doc_ref.get("ocr_text", "")
    original_hash = original_doc_ref.get("document_hash", "")
    
    if not original_text and original_hash:
        # If we only have hash, we can't do text comparison
        # In practice, original_text should be stored when document is first uploaded
        raise HTTPException(status_code=400, detail="Original document text not available for comparison. Please re-process the original document.")

    # OCR on uploaded document
    uploaded_text = await run_in_threadpool(extract_text_from_image, file_bytes)

    # Detect forgery by comparing
    forgery_result = detect_forgery(uploaded_text, original_text, threshold=0.85)

    # Also run structure verification on uploaded doc
    structure_result = verify_document_structure(uploaded_text, "unknown")

    return {
        "vault_id": vault_id,
        "document_id": document_id,
        "forgery_detection": forgery_result,
        "structure_verification": structure_result,
        "uploaded_text_preview": uploaded_text[:500] + "..." if len(uploaded_text) > 500 else uploaded_text
    }


@router.post("/document/analyze")
async def analyze_document_for_fraud(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    user_id: str = Depends(get_current_user)
):
    """
    Analyze a single document for fraud indicators without comparison.
    Returns structure verification and text analysis.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and PDF are allowed.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    extracted_text = await run_in_threadpool(extract_text_from_image, file_bytes)
    structure_result = verify_document_structure(extracted_text, document_type)
    doc_hash = get_document_hash(extracted_text)

    return {
        "user_id": user_id,
        "document_hash": doc_hash,
        "structure_verification": structure_result,
        "extracted_text_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
        "text_length": len(extracted_text),
        "word_count": len(extracted_text.split())
    }


@router.post("/nominee-ocr")
async def verify_nominee_identity(
    nominee_email: str = Form(...),
    file: UploadFile = File(...),
    session: dict = Depends(verify_vault_jwt)
):
    """
    Identity verification endpoint for Nominees unlocking a Vault.
    Uploads ID to GCS, runs the configured OCR provider, and checks document text.
    Returns a newly signed JWT with is_ocr_verified=True on success.
    """
    import jwt
    from app.config import settings
    from app.services.database import get_nominees_by_vault_id, update_nominee_ocr_status
    import re

    vault_id = session.get("vault_id")
    role = session.get("role")
    
    if not vault_id or role != "nominee":
        raise HTTPException(status_code=403, detail="Invalid session. Only nominees require OCR verification.")
        
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and PDF are allowed.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
        
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
        
    # Extraction is blocking network work; keep the event loop available.
    extracted_text = await run_in_threadpool(extract_text_from_image, file_bytes)
    
    # Validation logic: fuzzy match name from email prefix
    name_hint = nominee_email.split("@")[0].replace(".", " ").lower()
    name_hint = re.sub(r'\d+', '', name_hint).strip()
    
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
        "message": "Document text matched the existing nominee check.",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 900
    }


@router.post("/vault-access")
async def verify_vault_access(request: dict):
    """
    Verifies user vault access with vault code and secret key (or nominee keys).
    Locks vault after 5 failed attempts.
    """
    from app.services.database import get_vault_by_code, get_nominees_by_vault_id, increment_failed_attempts, reset_failed_attempts, lock_vault
    from app.utils.crypto import verify_key
    import jwt
    import datetime
    from app.config import settings
    
    vault_code = request.get("vault_code")
    secret_key = request.get("secret_key")
    nominee_keys = request.get("nominee_keys")
    
    vault = get_vault_by_code(vault_code)
    
    if not vault:
        raise HTTPException(status_code=401, detail="Invalid vault code or credentials")
        
    if vault.get("is_locked"):
        raise HTTPException(status_code=403, detail="Vault is locked due to too many failed attempts")
        
    is_valid = False
    role = "owner"
    is_ocr_verified = True
    
    if secret_key:
        is_valid = verify_key(secret_key, vault.get("owner_secret_key_hash"))
        role = "owner"
        is_ocr_verified = True
    elif nominee_keys is not None:
        nominees = get_nominees_by_vault_id(vault["id"])
        if not nominees:
            is_valid = False
        elif len(nominee_keys) != len(nominees):
            is_valid = False
        else:
            role = "nominee"
            is_ocr_verified = False
            matched_indices = set()
            is_valid = True
            for provided_key in nominee_keys:
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
    
    # Send vault access notification to nominees
    from app.services.database import get_nominee_emails
    from app.services.email_service import send_vault_access_notification
    
    nominee_emails = get_nominee_emails(vault["id"])
    accessed_by = "Owner" if role == "owner" else "Nominee"
    if nominee_emails:
        send_vault_access_notification(nominee_emails, vault_code, accessed_by)
    
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
