import base64
import os
import bcrypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

def hash_key(key: str) -> str:
    # Hash a key using bcrypt
    salt = bcrypt.gensalt()
    # bcrypt expects bytes
    hashed = bcrypt.hashpw(key.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_key(key: str, hashed_key: str) -> bool:
    # Verify a key against a hash
    try:
        return bcrypt.checkpw(key.encode('utf-8'), hashed_key.encode('utf-8'))
    except Exception:
        return False

def encrypt_data(data: str, key_hex: str) -> dict:
    # Key should be a 32-byte (64 char) hex string
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    iv = os.urandom(12)
    
    # Encrypt data (returns ciphertext + tag combined)
    encrypted = aesgcm.encrypt(iv, data.encode('utf-8'), None)
    
    # Extract tag (last 16 bytes) and actual ciphertext
    ciphertext = encrypted[:-16]
    auth_tag = encrypted[-16:]
    
    return {
        "encrypted_data": base64.b64encode(ciphertext).decode('utf-8'),
        "iv": base64.b64encode(iv).decode('utf-8'),
        "auth_tag": base64.b64encode(auth_tag).decode('utf-8')
    }

def decrypt_data(encrypted_data_b64: str, iv_b64: str, auth_tag_b64: str, key_hex: str) -> str:
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    
    ciphertext = base64.b64decode(encrypted_data_b64)
    iv = base64.b64decode(iv_b64)
    auth_tag = base64.b64decode(auth_tag_b64)
    
    # AESGCM decrypt expects ciphertext + auth_tag combined
    data_to_decrypt = ciphertext + auth_tag
    
    try:
        decrypted = aesgcm.decrypt(iv, data_to_decrypt, None)
        return decrypted.decode('utf-8')
    except InvalidTag:
        raise ValueError("Invalid authentication tag. Decryption failed.")
