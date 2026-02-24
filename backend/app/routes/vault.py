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

@router.post("/create")
async def create_secure_vault(user_id: str = Depends(get_current_user)):
    """
    First-time vault creation.
    - Generates vaultCode (10-12 chars uppercase alphanumeric)
    - Generates ownerSecretKey (32 chars alphabetic)
    - Hashes ownerSecretKey with bcrypt
    - Stores vaultCode, userId, ownerSecretKeyHash
    - Returns vaultCode and raw ownerSecretKey (only once)
    """
    from app.utils.key_generator import generate_vault_code, generate_secret_key
    from app.utils.crypto import hash_key
    from app.services.database import create_vault_record
    
    vault_code = generate_vault_code()
    owner_secret_key = generate_secret_key()
    owner_secret_key_hash = hash_key(owner_secret_key)
    
    record = create_vault_record(user_id, vault_code, owner_secret_key_hash)
    
    return {
        "status": "success",
        "vault_code": vault_code,
        "owner_secret_key": owner_secret_key,
        "message": "Vault created successfully. Save your secret key securely. It will not be shown again."
    }

@router.get("/{vault_code}/requirements")
async def get_vault_requirements(vault_code: str):
    """
    Returns the number of nominees required to unlock the vault.
    If 0, it only requires the owner key.
    """
    from app.services.database import get_vault_by_code, get_nominees_by_vault_id
    
    vault = get_vault_by_code(vault_code)
    if not vault:
        # Don't throw 404 to avoid code enumeration, just return 0, though 404 is fine too.
        raise HTTPException(status_code=404, detail="Vault not found")
        
    nominees = get_nominees_by_vault_id(vault["id"])
    return {
        "status": "success",
        "nominee_count": len(nominees) if nominees else 0
    }
