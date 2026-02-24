from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response
from typing import List, Optional
import uuid
from datetime import datetime
from app.services.database import get_supabase_client
from app.services.encryption_service import encrypt_pdf_bytes, decrypt_pdf_bytes
from app.services.gcs_service import gcs_service
from app.middleware.vault_auth import verify_vault_jwt
from app.schema.document_model import DocumentResponse

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_CATEGORIES = {'wills', 'legal_contracts', 'property_documents', 'other'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(...),
    session: dict = Depends(verify_vault_jwt)
):
    # Verify Vault ID exists in token
    vault_id = session.get("vault_id")
    if not vault_id:
        raise HTTPException(status_code=403, detail="Vault session invalid or missing vault_id")
        
    role = session.get("role")
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only the vault owner can upload documents.")
    
    # Restrict to PDF
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of {ALLOWED_CATEGORIES}")
    
    # Check file size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
        
    # Encrypt Binary
    try:
        encrypted_bytes, iv_hex = encrypt_pdf_bytes(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption failed: {e}")
        
    # Create unique path
    timestamp = int(datetime.utcnow().timestamp())
    random_id = str(uuid.uuid4())[:8]
    gcs_path = f"{vault_id}/{category}/{timestamp}-{random_id}.aes" # Ext to show it is encrypted
    
    # Upload encrypted bytes to GCS
    try:
        gcs_url = gcs_service.upload_file(
            destination_blob_name=gcs_path, 
            file_bytes=encrypted_bytes, 
            content_type="application/octet-stream" # Stored as binary, not raw pdf
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage service unavailable or unauthorized: {e}")
        
    # Store Metadata in Supabase
    user_email = session.get("email", "unknown_user@example.com") # Depends on your JWT payload
    doc_id = str(uuid.uuid4())
    
    supabase = get_supabase_client()
    db_response = supabase.table("documents").insert({
        "id": doc_id,
        "vault_id": vault_id,
        "file_name": file.filename,
        "category": category,
        "gcs_path": gcs_path,
        "uploaded_by": user_email,
        "encryption_iv": iv_hex
    }).execute()
    
    if not db_response.data:
        # Rollback GCS if DB fails
        gcs_service.delete_file(gcs_path)
        raise HTTPException(status_code=500, detail="Failed to save document metadata.")
        
    record = db_response.data[0]
    return DocumentResponse(**record)

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    category: Optional[str] = None,
    session: dict = Depends(verify_vault_jwt)
):
    vault_id = session.get("vault_id")
    if not vault_id:
        raise HTTPException(status_code=403, detail="Vault session invalid.")
        
    role = session.get("role")
    if role == "nominee" and not session.get("is_ocr_verified", False):
        raise HTTPException(status_code=403, detail="Nominees must pass OCR identity verification to view documents.")
        
    supabase = get_supabase_client()    
    query = supabase.table("documents").select("*").eq("vault_id", vault_id)
    if category:
        query = query.eq("category", category)
        
    response = query.order("created_at", desc=True).execute()
    return [DocumentResponse(**doc) for doc in response.data]

@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    session: dict = Depends(verify_vault_jwt)
):
    vault_id = session.get("vault_id")
    
    role = session.get("role")
    if role == "nominee" and not session.get("is_ocr_verified", False):
        raise HTTPException(status_code=403, detail="Nominees must pass OCR identity verification to download documents.")
        
    # Fetch Metadata
    supabase = get_supabase_client()
    response = supabase.table("documents").select("*").eq("id", document_id).eq("vault_id", vault_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    doc = response.data[0]
    gcs_path = doc["gcs_path"]
    iv_hex = doc["encryption_iv"]
    file_name = doc["file_name"]
    
    # Download encrypted bytes from GCS
    try:
        encrypted_bytes = gcs_service.download_file(gcs_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve file from storage.")
        
    # Decrypt bytes
    try:
        decrypted_pdf_bytes = decrypt_pdf_bytes(encrypted_bytes, iv_hex)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Decryption failed. Vault key mismatch or corrupted file.")
        
    return Response(
        content=decrypted_pdf_bytes, 
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'}
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    session: dict = Depends(verify_vault_jwt)
):
    vault_id = session.get("vault_id")
    
    role = session.get("role")
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only the vault owner can delete documents.")
        
    # Verify ownership before deleting
    supabase = get_supabase_client()
    response = supabase.table("documents").select("gcs_path").eq("id", document_id).eq("vault_id", vault_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")
        
    gcs_path = response.data[0]["gcs_path"]
    
    # Delete from GCS
    gcs_service.delete_file(gcs_path)
    
    # Delete from DB
    supabase.table("documents").delete().eq("id", document_id).execute()
    
    return {"status": "success", "detail": "Document permanently deleted."}
