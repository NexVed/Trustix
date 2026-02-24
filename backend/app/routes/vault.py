from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
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
        "vault_id": record["id"] if record else None,
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
        raise HTTPException(status_code=404, detail="Vault not found")
        
    nominees = get_nominees_by_vault_id(vault["id"])
    return {
        "status": "success",
        "nominee_count": len(nominees) if nominees else 0
    }


@router.get("/{vault_id}/nominees")
async def get_vault_nominees(vault_id: str, user_id: str = Depends(get_current_user)):
    """
    Returns all nominees for a specific vault.
    """
    from app.services.database import get_nominees_by_vault_id
    
    nominees_raw = get_nominees_by_vault_id(vault_id)
    nominees = []
    for n in nominees_raw:
        nominees.append({
            "id": n.get("id"),
            "name": n.get("name", ""),
            "email": n.get("nominee_email", ""),
            "verification_level": n.get("verification_level", "Level 1 — Basic"),
            "legal_approval": n.get("legal_approval", "Pending"),
            "trigger_condition": n.get("trigger_condition", ""),
            "asset_count": 0,
            "multi_party_status": "0/3 Approved",
            "created_at": n.get("created_at", ""),
        })
    
    return {"status": "success", "nominees": nominees}


from pydantic import BaseModel

class AddNomineeRequest(BaseModel):
    name: str
    email: str
    verification_level: str = "Level 1 — Basic"
    trigger_condition: str = "180-day inactivity"


@router.post("/{vault_id}/nominees")
async def add_vault_nominee(vault_id: str, body: AddNomineeRequest, user_id: str = Depends(get_current_user)):
    """
    Adds a new nominee to a vault.
    Auto-generates a unique secret key for the nominee.
    Returns the raw key ONCE so the owner can share it with the nominee.
    The hashed key is stored in DB for future vault-access verification.
    """
    from app.utils.key_generator import generate_secret_key
    from app.utils.crypto import hash_key
    from app.services.database import add_nominee_for_vault
    
    # Generate the nominee's secret key
    nominee_secret_key = generate_secret_key()
    nominee_secret_key_hash = hash_key(nominee_secret_key)
    
    nominee = add_nominee_for_vault(
        vault_id=vault_id,
        name=body.name,
        email=body.email,
        verification_level=body.verification_level,
        trigger_condition=body.trigger_condition,
        nominee_secret_key_hash=nominee_secret_key_hash,
    )
    
    if not nominee:
        raise HTTPException(status_code=500, detail="Failed to add nominee.")
    
    return {
        "status": "success",
        "nominee": nominee,
        "nominee_secret_key": nominee_secret_key,
        "message": "Nominee added. Share this secret key with the nominee securely. It will NOT be shown again."
    }
