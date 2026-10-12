from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.services.auth import get_current_user
from app.services.database import get_supabase_client


router = APIRouter(prefix="/auth", tags=["Authentication"])


class ProfileSyncRequest(BaseModel):
    id: str
    email: EmailStr
    full_name: str = ""
    avatar_url: str = ""


@router.post("/signup-sync")
def sync_profile(
    body: ProfileSyncRequest,
    user_id: str = Depends(get_current_user),
):
    """Synchronize the authenticated Supabase user with the public users table."""
    if body.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A user can only synchronize their own profile.",
        )

    client = get_supabase_client()
    response = client.table("users").upsert(
        {
            "id": user_id,
            "email": body.email,
            "full_name": body.full_name,
            "avatar_url": body.avatar_url,
        },
        on_conflict="id",
    ).execute()

    return {"status": "success", "user": response.data[0] if response.data else None}
