from fastapi import APIRouter, Depends, HTTPException, status
from eth_account import Account
from eth_account.messages import encode_defunct

from app.services.auth import get_current_user
from app.models import WalletLinkRequest
from app.services.database import link_wallet_to_user_db

router = APIRouter(prefix="/wallet", tags=["Wallet"])

@router.post("/link")
def link_wallet(request: WalletLinkRequest, user_id: str = Depends(get_current_user)):
    """
    Links a MetaMask wallet to the authenticated user.
    Optionally verifies a cryptographic signature to prove ownership.
    """
    wallet_address = request.wallet_address
    
    # 1. Validate Ethereum Address Format
    if not Account.is_address(wallet_address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Ethereum wallet address format."
        )
        
    # Standardize to checksum address
    checksum_address = Account.to_checksum_address(wallet_address)
    
    # 2. Optional Signature Verification
    if request.signature:
        try:
            # We assume the user signed their Supabase user_id as a proof of ownership
            message = encode_defunct(text=f"Trustix Login: {user_id}")
            recovered_address = Account.recover_message(message, signature=request.signature)
            
            if recovered_address.lower() != checksum_address.lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Signature verification failed: Recovered address does not match."
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid signature: {str(e)}"
            )

    # 3. Store in Supabase PostgREST
    link_wallet_to_user_db(user_id, checksum_address)
    
    return {
        "status": "success",
        "message": f"Wallet {checksum_address} successfully linked.",
        "user_id": user_id
    }
