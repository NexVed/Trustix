from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.services.auth import get_current_user
from app.services.database import get_supabase_client
from pydantic import BaseModel

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("")
async def get_activities(
    user_id: str = Depends(get_current_user),
    vault_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    Paginated activity log for the current user.
    Optionally filter by vault_id, action type, or result.
    """
    client = get_supabase_client()
    try:
        query = client.table("user_activities").select("*", count="exact").eq("user_id", user_id)

        if vault_id:
            query = query.eq("vault_id", vault_id)
        if action:
            query = query.eq("action", action)
        if result:
            query = query.eq("type", result)

        offset = (page - 1) * page_size
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)

        response = query.execute()

        return {
            "activities": response.data or [],
            "total": response.count or 0,
            "page": page,
            "page_size": page_size,
        }
    except Exception as e:
        print(f"Error fetching activities: {e}")
        return {"activities": [], "total": 0, "page": page, "page_size": page_size}


class LogActivityRequest(BaseModel):
    action: str
    entity: str
    type: str = "Success"
    vault_id: Optional[str] = None


@router.post("")
async def log_activity(body: LogActivityRequest, user_id: str = Depends(get_current_user)):
    """Log a new activity event."""
    client = get_supabase_client()
    try:
        data = {
            "user_id": user_id,
            "action": body.action,
            "entity": body.entity,
            "type": body.type,
        }
        if body.vault_id:
            data["vault_id"] = body.vault_id

        response = client.table("user_activities").insert(data).execute()
        return {"status": "success", "activity": response.data[0] if response.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log activity: {str(e)}")
