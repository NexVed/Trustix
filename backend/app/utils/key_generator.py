import secrets
import string
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class InheritorKey:
    """Represents a secret key for an inheritor with role."""
    name: str
    role: str
    secret_key: str
    secret_key_hash: str


def generate_secret_key() -> str:
    """
    Generates a 32-character alphabetic secure key.
    Uses Python's cryptographically secure 'secrets' module.
    """
    alphabet = string.ascii_letters
    return ''.join(secrets.choice(alphabet) for _ in range(32))


def generate_vault_code() -> str:
    """
    Generates a 12-character uppercase alphanumeric vault code.
    """
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(12))


def generate_inheritor_keys(
    inheritors: List[Dict[str, str]], 
    threshold: int
) -> Dict[str, any]:
    """
    Generate secret keys for each inheritor.
    
    Args:
        inheritors: List of dicts with 'name' and 'role' keys
        threshold: Number of keys required to unlock vault
        
    Returns:
        Dict with inheritor_keys list and threshold
    """
    if threshold < 1:
        threshold = 1
    if threshold > len(inheritors):
        threshold = len(inheritors)
    
    keys = []
    for inheritor in inheritors:
        secret_key = generate_secret_key()
        keys.append(InheritorKey(
            name=inheritor.get("name", ""),
            role=inheritor.get("role", "inheritor"),
            secret_key=secret_key,
            secret_key_hash=""  # Will be hashed by caller
        ))
    
    return {
        "threshold": threshold,
        "total_keys": len(keys),
        "inheritor_keys": [
            {
                "name": k.name,
                "role": k.role,
                "secret_key": k.secret_key,
                "secret_key_hash": k.secret_key_hash
            }
            for k in keys
        ]
    }


def validate_threshold(threshold: int, total_keys: int) -> int:
    """Validate and clamp threshold between 1 and total_keys."""
    if threshold < 1:
        return 1
    if threshold > total_keys:
        return total_keys
    return threshold