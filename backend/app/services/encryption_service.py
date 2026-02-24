import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException

# For a production system with zero-knowledge, the user might derive
# a key from their password to encrypt their documents.
# For simplicity and robust encryption, if no key is provided, we can use a strong 
# server-side generic key, but ideally, we should use a key derived from the user's secret.
# In this environment, we'll use a strong predefined AES-256 key from env or a fixed one for testing.

# Use 32 bytes (256 bits) for AES-256
# In production, this should NEVER be hardcoded and should ideally come from the user's client-side hash.
_MASTER_KEY_HEX = os.environ.get("DOCUMENT_MASTER_KEY", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")

def get_encryption_key() -> bytes:
    try:
        return bytes.fromhex(_MASTER_KEY_HEX)
    except ValueError:
        raise ValueError("Invalid master key format. Must be a 64-character hex string.")

def encrypt_pdf_bytes(pdf_bytes: bytes) -> tuple[bytes, str]:
    """
    Encrypts raw bytes using AES-256-GCM.
    Returns the encrypted bytes (ciphertext + auth tag) and the IV as a hex string.
    """
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    iv = os.urandom(12) # 96-bit IV is standard for GCM
    
    # Encrypt data
    encrypted_data = aesgcm.encrypt(iv, pdf_bytes, None)
    
    return encrypted_data, iv.hex()

def decrypt_pdf_bytes(encrypted_bytes: bytes, iv_hex: str) -> bytes:
    """
    Decrypts AES-256-GCM encrypted bytes back to raw PDF bytes.
    """
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    
    try:
        iv = bytes.fromhex(iv_hex)
        decrypted_data = aesgcm.decrypt(iv, encrypted_bytes, None)
        return decrypted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to decrypt file. It may be corrupted or the key is incorrect.")

from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import base64

_WALLET_ENCRYPTION_SALT = os.environ.get("WALLET_ENCRYPTION_SALT", "default_salt_for_wallet_encryption_change_in_prod")

def get_pbkdf2_key(password: str) -> bytes:
    """Derives a 256-bit AES key from a password using PBKDF2 (100,000 iterations)."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_WALLET_ENCRYPTION_SALT.encode('utf-8'),
        iterations=100000,
    )
    return kdf.derive(password.encode('utf-8'))

def encrypt_private_key(private_key: str, password: str) -> dict:
    """
    Encrypts a raw Ethereum private key using AES-256-GCM.
    Returns base64 encoded strings for the encrypted key, iv, and auth tag.
    """
    key = get_pbkdf2_key(password)
    aesgcm = AESGCM(key)
    iv = os.urandom(12) # 96-bit IV
    
    encrypted_data = aesgcm.encrypt(iv, private_key.encode('utf-8'), None)
    
    # The cryptography library appends the 16-byte auth tag at the end of the ciphertext
    ciphertext = encrypted_data[:-16]
    auth_tag = encrypted_data[-16:]

    return {
        "encrypted_private_key": base64.b64encode(ciphertext).decode('utf-8'),
        "iv": base64.b64encode(iv).decode('utf-8'),
        "auth_tag": base64.b64encode(auth_tag).decode('utf-8')
    }

def decrypt_private_key(encrypted_private_key_b64: str, iv_b64: str, auth_tag_b64: str, password: str) -> str:
    """
    Decrypts an AES-256-GCM encrypted private key.
    """
    try:
        key = get_pbkdf2_key(password)
        aesgcm = AESGCM(key)
        
        iv = base64.b64decode(iv_b64)
        ciphertext = base64.b64decode(encrypted_private_key_b64)
        auth_tag = base64.b64decode(auth_tag_b64)
        
        # cryptography expects ciphertext + auth_tag
        encrypted_data = ciphertext + auth_tag
        
        decrypted_bytes = aesgcm.decrypt(iv, encrypted_data, None)
        return decrypted_bytes.decode('utf-8')
    except Exception as e:
        raise HTTPException(status_code=400, detail="Decryption failed. Invalid password or corrupted data.")
