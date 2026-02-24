from fastapi import HTTPException, Security, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings

security = HTTPBearer(auto_error=False)

def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    # 1. Try to get token from cookie
    token = request.cookies.get("sb-access-token")
    
    # 2. Fallback to Authorization Bearer header
    if not token and credentials:
        token = credentials.credentials
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Missing Bearer token or sb-access-token cookie."
        )

    try:
        from supabase import create_client
        # Instantiate a temporary client using the anon key to validate the user's access token
        # The anon key is safe to use for this, as the token itself proves authentication
        temp_client = create_client(settings.supabase_url, settings.supabase_anon_key if hasattr(settings, 'supabase_anon_key') and settings.supabase_anon_key else settings.supabase_service_role_key)
        
        user_response = temp_client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials or token expired"
            )
            
        return user_response.user.id
    except Exception as e:
        print("Auth Error:", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials or token expired"
        )
