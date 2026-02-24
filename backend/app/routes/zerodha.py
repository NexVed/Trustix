from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from app.services.zerodha_service import zerodha_service
from app.services.auth import get_current_user
from app.schema.portfolio import PortfolioResponse

router = APIRouter(prefix="/zerodha", tags=["zerodha"])

@router.get("/login")
async def login_zerodha():
    """
    Step 1 of OAuth: Redirects the user to the Zerodha login page.
    """
    login_url = zerodha_service.get_login_url()
    return RedirectResponse(url=login_url)

@router.get("/callback")
async def zerodha_callback(
    request_token: str = Query(...), 
    user=Depends(get_current_user)
):
    """
    Step 2 of OAuth: Zerodha redirects back here with a `request_token`.
    We exchange this for an `access_token` and save it securely.
    """
    if not request_token:
        raise HTTPException(status_code=400, detail="Missing request_token from Zerodha.")
    
    # Store token encrypted in DB linked to this user's profile
    result = zerodha_service.generate_and_store_token(request_token, user["id"])
    
    # Normally, redirect back to frontend dashboard after success
    # Assuming frontend is on port 5173 or read from settings
    from app.config import settings
    frontend_url = settings.frontend_url or "http://localhost:5173"
    
    return RedirectResponse(url=f"{frontend_url}/dashboard?zerodha=success")

@router.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio(user=Depends(get_current_user)):
    """
    Authenticated endpoint to fetch the user's zerodha holdings and positions.
    It automatically decrypts their access token from the DB.
    """
    return zerodha_service.fetch_portfolio(user["id"])
