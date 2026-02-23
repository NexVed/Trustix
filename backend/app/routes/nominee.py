from fastapi import APIRouter, Depends
from app.services.auth import get_current_user
from app.models import NomineeAddRequest

from app.services.database import add_nominee_to_db

router = APIRouter(prefix="/nominee", tags=["Nominee"])

@router.post("/add")
def add_nominee(request: NomineeAddRequest, user_id: str = Depends(get_current_user)):
    """
    Adds a nominee for the authenticated user to Supabase PostgREST.
    """
    nominee_email = request.nominee_email
    
    # Insert effectively into Supabase via PostgREST
    add_nominee_to_db(user_id, nominee_email)
        
    return {
        "status": "success",
        "message": f"Nominee {nominee_email} added successfully.",
        "user_id": user_id
    }
