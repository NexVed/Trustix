from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth import get_current_user
from app.models import StoreProfileRequest
from app.services.database import save_secure_profile, get_secure_profile

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.post("/store")
def store_profile(request: StoreProfileRequest, user_id: str = Depends(get_current_user)):
    """
    Stores an end-to-end encrypted user profile blob.
    Backend remains zero-knowledge: no keys or plaintext data are handled.
    """
    save_secure_profile(
        user_id=user_id,
        encrypted_blob=request.encrypted_blob,
        salt=request.salt,
        iv=request.iv
    )
    
    return {
        "status": "success",
        "message": "Secure profile stored successfully."
    }

@router.get("/me")
def retrieve_profile(user_id: str = Depends(get_current_user)):
    """
    Retrieves the end-to-end encrypted user profile blob.
    Frontend is responsible for decryption using the PBKDF2 derived key.
    """
    profile = get_secure_profile(user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No secure profile found for this user."
        )
        
    return profile
