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

class SignedURLResponse(BaseModel):
    url: str
    expires_in_minutes: int
