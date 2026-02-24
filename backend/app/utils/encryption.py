import os
from cryptography.fernet import Fernet
from fastapi import HTTPException

# For strictly encrypting string tokens (like Zerodha access_token) in PostgreSQL.
# In a robust production environment, manage this key via a secret manager.
_FERNET_KEY_HEX = os.environ.get("TOKEN_ENCRYPTION_KEY", Fernet.generate_key().decode())

def get_fernet() -> Fernet:
    """Returns a Fernet instance using the configured secret key."""
    try:
        # Fernet requires url-safe base64-encoded 32-byte key
        return Fernet(_FERNET_KEY_HEX.encode())
    except Exception as e:
        raise ValueError(f"Invalid TOKEN_ENCRYPTION_KEY format: {e}")

def encrypt_token(plain_token: str) -> str:
    """
    Encrypts a plaintext string token suitable for database storage.
    Returns the encrypted token as a string.
    """
    if not plain_token:
        return ""
    
    fernet = get_fernet()
    encrypted_bytes = fernet.encrypt(plain_token.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")

def decrypt_token(encrypted_token: str) -> str:
    """
    Decrypts an encrypted string token back to plaintext.
    """
    if not encrypted_token:
        return ""
        
    fernet = get_fernet()
    try:
        decrypted_bytes = fernet.decrypt(encrypted_token.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to decrypt secure token.")
