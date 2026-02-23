from fastapi import APIRouter, Depends, UploadFile, File
from app.services.auth import get_current_user
from app.services.blockchain import generate_blockchain_hash
from app.services.storage import upload_encrypted_vault

from app.services.database import save_vault_metadata

router = APIRouter(prefix="/vault", tags=["Vault"])

@router.post("/upload")
async def upload_vault(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Accepts encrypted vault data as a file upload.
    Generates a blockchain mock hash, and uploads to Google Cloud Storage.
    Stores metadata in Supabase PostgREST.
    """
    data = await file.read()
    
    # Generate mock blockchain hash
    blockchain_hash = generate_blockchain_hash(data)
    
    # Upload to GCS
    file_url = upload_encrypted_vault(data, user_id)
    
    # Save metadata to Supabase DB via PostgREST
    save_vault_metadata(user_id, file_url, blockchain_hash)
    
    return {
        "file_url": file_url,
        "blockchain_hash": blockchain_hash,
        "user_id": user_id
    }
