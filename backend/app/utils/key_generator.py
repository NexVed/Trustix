import secrets
import string

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
