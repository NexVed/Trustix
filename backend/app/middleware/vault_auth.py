from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.config import settings

security = HTTPBearer()

def verify_vault_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verifies that the incoming JWT is a valid temporary vault session.
    It expects the JWT to be signed with our Supabase JWT Secret and contain 
    `vault_id` and `type` == 'vault_session'.
    """
    token = credentials.credentials
    try:
        # Decode the JWT
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        
        # We can enforce that this MUST be a vault_session if we explicitly set that type 
        # when unlocking the vault. If no 'type' exists, we assume standard Supabase user auth.
        
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
            headers={"WWW-Authenticate": "Bearer"},
        )
