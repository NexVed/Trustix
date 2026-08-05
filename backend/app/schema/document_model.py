from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    vault_id: str
    file_name: str
    category: str
    uploaded_by: str
    created_at: datetime
    gcs_path: Optional[str] = None
    encryption_iv: Optional[str] = None


class VaultDocumentResponse(BaseModel):
    id: str
    vault_id: str
    document_type: str
    original_file_name: str
    gcs_path: Optional[str] = None
    ocr_text: Optional[str] = None
    document_hash: Optional[str] = None
    uploaded_by: str
    created_at: datetime


class SignedURLResponse(BaseModel):
    url: str
    expires_in_minutes: int