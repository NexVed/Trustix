from fastapi import APIRouter, Depends, HTTPException, status
from eth_account import Account
from eth_account.messages import encode_defunct

from app.services.auth import get_current_user
from app.models import WalletLinkRequest, StoreWalletRequest, VerifySignatureRequest
from app.services.database import link_wallet_to_user_db, store_encrypted_wallet_db, get_custodial_wallet_db
from app.services.encryption_service import encrypt_private_key

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

@router.post("/store")
def store_wallet(request: StoreWalletRequest, user_id: str = Depends(get_current_user)):
    """
    Encrypts a raw Ethereum private key using AES-256 and stores it in the database.
    This creates a Custodial Wallet structure for the user.
    """
    try:
        # Extract the public address from the private key using ethers logic
        acct = Account.from_key(request.private_key)
        wallet_address = acct.address
        
        # Encrypt the private key using PBKDF2 string derivation from user password
        encryption_data = encrypt_private_key(request.private_key, request.password)
        
        # Store in Supabase
        store_encrypted_wallet_db(
            user_id=user_id,
            address=wallet_address,
            encrypted_key=encryption_data["encrypted_private_key"],
            iv=encryption_data["iv"],
            auth_tag=encryption_data["auth_tag"]
        )
        
        return {
            "status": "secured",
            "wallet_address": wallet_address
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to secure and store wallet: {str(e)}"
        )

@router.get("/address")
def get_wallet_address(user_id: str = Depends(get_current_user)):
    """
    Returns the stored connected wallet or generated public address.
    """
    wallet_data = get_custodial_wallet_db(user_id)
    if not wallet_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No custodial wallet found for this user."
        )
    return {
        "wallet_address": wallet_data.get("wallet_address")
    }

@router.post("/verify-signature")
def verify_signature(request: VerifySignatureRequest, user_id: str = Depends(get_current_user)):
    """
    Verifies a cryptographic signature against the user's stored custodial wallet.
    """
    wallet_data = get_custodial_wallet_db(user_id)
    if not wallet_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No custodial wallet found for this user."
        )
    
    expected_address = wallet_data.get("wallet_address")
    
    try:
        message = encode_defunct(text=request.message)
        recovered_address = Account.recover_message(message, signature=request.signature)
        
        if recovered_address.lower() != expected_address.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Signature verification failed: Recovered address does not match."
            )
            
        return {"status": "success", "message": "Signature verified successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid signature: {str(e)}"
        )
