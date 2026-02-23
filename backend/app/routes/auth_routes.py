from fastapi import APIRouter, Depends, HTTPException, status
from app.services.auth import get_current_user
from app.services.database import upsert_user_profile, get_user_profile
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserSyncRequest(BaseModel):
    email: str
    full_name: str = ""
    avatar_url: str = ""


@router.post("/signup-sync")
def sync_user_profile(request: UserSyncRequest, user_id: str = Depends(get_current_user)):
    """
    Syncs user profile data from Supabase Auth to the public.users table.
    Called by the frontend after sign-up or sign-in.
    """
    result = upsert_user_profile(
        user_id=user_id,
        email=request.email,
        full_name=request.full_name,
        avatar_url=request.avatar_url,
    )
    return {
        "status": "success",
        "message": "User profile synced successfully.",
        "data": result,
    }


@router.get("/me")
def get_current_user_profile(user_id: str = Depends(get_current_user)):
    """
    Returns the current authenticated user's profile from public.users.
    """
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )
    return profile
