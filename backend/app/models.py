from pydantic import BaseModel, EmailStr

class NomineeAddRequest(BaseModel):
    nominee_email: EmailStr

class TriggerCheckRequest(BaseModel):
    last_active_days: int

class WalletLinkRequest(BaseModel):
    wallet_address: str
    signature: str | None = None  # Optional for MVP, but good for real verification

class StoreProfileRequest(BaseModel):
    encrypted_blob: str
    salt: str
    iv: str
