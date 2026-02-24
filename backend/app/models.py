from pydantic import BaseModel, EmailStr
from typing import List, Optional

class NomineeAddRequest(BaseModel):
    nominee_email: EmailStr

class NomineeAddSecureRequest(BaseModel):
    vault_id: str
    nominee_email: EmailStr

class TriggerCheckRequest(BaseModel):
    last_active_days: int

class WalletLinkRequest(BaseModel):
    wallet_address: str
    signature: str | None = None  # Optional for MVP, but good for real verification

class StoreWalletRequest(BaseModel):
    private_key: str
    password: str

class VerifySignatureRequest(BaseModel):
    message: str
    signature: str


class StoreProfileRequest(BaseModel):
    encrypted_blob: str
    salt: str
    iv: str

class VaultInitRequest(BaseModel):
    key: str

class VaultVerifyRequest(BaseModel):
    key: str

class VaultDataStoreRequest(BaseModel):
    key: str
    data: str
    
class VaultDataRetrieveRequest(BaseModel):
    key: str

class VaultAccessRequest(BaseModel):
    vault_code: str
    secret_key: Optional[str] = None
    nominee_keys: Optional[List[str]] = None
