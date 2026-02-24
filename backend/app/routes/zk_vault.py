from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.services.auth import get_current_user
from app.services.database import init_zk_vault, get_zk_vault, update_zk_vault_data
from app.models import VaultInitRequest, VaultVerifyRequest, VaultDataStoreRequest, VaultDataRetrieveRequest
from app.utils.crypto import hash_key, verify_key, encrypt_data, decrypt_data
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/zk-vault", tags=["Zero-Knowledge Vault"])

@router.get("/status")
def get_vault_status(user_id: str = Depends(get_current_user)):
    vault = get_zk_vault(user_id)
    return {"status": "success", "initialized": vault is not None}

@router.post("/init")
def initialize_vault(request_data: VaultInitRequest, user_id: str = Depends(get_current_user)):
    vault = get_zk_vault(user_id)
    if vault:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vault already initialized")
    
    hashed = hash_key(request_data.key)
    init_zk_vault(user_id, hashed)
    return {"status": "success", "message": "Vault initialized successfully"}

@router.post("/verify")
@limiter.limit("5/minute")
def verify_vault_key(request: Request, request_data: VaultVerifyRequest, user_id: str = Depends(get_current_user)):
    vault = get_zk_vault(user_id)
    if not vault:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault not initialized")
    
    if not verify_key(request_data.key, vault["hashed_key"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid vault key")
    
    return {"status": "success", "message": "Vault key verified"}

@router.post("/data")
def store_vault_data(request_data: VaultDataStoreRequest, user_id: str = Depends(get_current_user)):
    vault = get_zk_vault(user_id)
    if not vault:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault not initialized")
    
    if not verify_key(request_data.key, vault["hashed_key"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid vault key")
    
    try:
        enc_payload = encrypt_data(request_data.data, request_data.key)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    update_zk_vault_data(user_id, enc_payload["encrypted_data"], enc_payload["iv"], enc_payload["auth_tag"])
    return {"status": "success", "message": "Data encrypted and stored"}

@router.post("/data/retrieve")
def retrieve_vault_data(request_data: VaultDataRetrieveRequest, user_id: str = Depends(get_current_user)):
    vault = get_zk_vault(user_id)
    if not vault:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vault not initialized")
    
    if not verify_key(request_data.key, vault["hashed_key"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid vault key")
        
    if not vault.get("encrypted_data"):
        return {"data": ""}
        
    try:
        decrypted = decrypt_data(vault["encrypted_data"], vault["iv"], vault["auth_tag"], request_data.key)
        return {"data": decrypted}
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Decryption failed. Data might be corrupted")
