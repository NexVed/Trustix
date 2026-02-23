from fastapi import APIRouter, Depends
from app.services.auth import get_current_user
from app.models import TriggerCheckRequest

router = APIRouter(prefix="/trigger", tags=["Trigger"])

@router.post("/check")
def check_trigger(request: TriggerCheckRequest, user_id: str = Depends(get_current_user)):
    """
    Simulates the dead-man trigger.
    If last_active_days > 30, it triggers the vault release simulation.
    """
    if request.last_active_days > 30:
        return {"status": "trigger_activated"}
    else:
        return {"status": "user_active"}
