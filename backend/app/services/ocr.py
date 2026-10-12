from pathlib import Path
from urllib.parse import urlsplit
import requests
from fastapi import HTTPException
from difflib import SequenceMatcher
import hashlib
from app.config import settings

OCR_SPACE_API_URL = "https://api.ocr.space/parse/image"
MODEL_ID = "ibm-granite/granite-docling-258M"
MAX_FILE_BYTES = 10 * 1024 * 1024


def _file_type(data: bytes) -> tuple[str, str]:
    if not data:
        raise HTTPException(400, "The document is empty.")
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(413, "Maximum document size is 10 MB.")
    if data.startswith(b"%PDF-"):
        return "pdf", "application/pdf"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    raise HTTPException(415, "Choose a PDF, PNG, or JPEG document.")


def _hf_token() -> str:
    if settings.hf_token:
        return settings.hf_token.strip()
    if settings.hf_token_path:
        try:
            return Path(settings.hf_token_path).expanduser().read_text().strip()
        except OSError:
            pass
    return ""


def _space_url() -> str:
    url = settings.hf_ocr_url.rstrip("/")
    try:
        parsed = urlsplit(url)
        port = parsed.port
    except ValueError:
        raise HTTPException(503, "The configured OCR Space address is invalid.")
    if (parsed.scheme != "https" or not (parsed.hostname or "").endswith(".hf.space")
            or parsed.username or parsed.password or parsed.query or parsed.fragment
            or parsed.path not in ("", "/") or port not in (None, 443)):
        raise HTTPException(503, "Configure HF_OCR_URL with the private Space's https://...hf.space address.")
    return url


def get_ocr_status() -> dict:
    configured = False
    if settings.ocr_provider == "granite_docling":
        try:
            _space_url()
            configured = bool(_hf_token() and settings.hf_ocr_api_key)
        except (HTTPException, ValueError):
            pass
    elif settings.ocr_provider == "ocr_space":
        configured = bool(settings.ocr_space_api_key)
    return {"provider": settings.ocr_provider, "model": MODEL_ID if settings.ocr_provider == "granite_docling" else "OCR.space",
            "configured": configured, "max_file_bytes": MAX_FILE_BYTES, "max_pages": 5}


def extract_document(file_bytes: bytes) -> dict:
    extension, mime = _file_type(file_bytes)
    files = {"file": (f"document.{extension}", file_bytes, mime)}
    if settings.ocr_provider == "ocr_space":
        return _legacy_extract(files, extension)
    if settings.ocr_provider != "granite_docling":
        raise HTTPException(503, "Unsupported OCR provider configured.")
    url = _space_url()
    token = _hf_token()
    if not token or not settings.hf_ocr_api_key:
        raise HTTPException(503, "OCR is not configured. Set the backend Hugging Face credentials.")
    try:
        response = requests.post(
            f"{url}/ocr", files=files,
            headers={"Authorization": f"Bearer {token}", "X-Trustix-OCR-Key": settings.hf_ocr_api_key},
            timeout=(15, max(30, min(settings.hf_ocr_timeout_seconds, 900))),
            allow_redirects=False,
        )
    except requests.Timeout:
        raise HTTPException(504, "OCR timed out. The Space may still be starting; retry with a smaller document.")
    except requests.RequestException:
        raise HTTPException(503, "The OCR Space is unavailable. Please retry shortly.")
    if response.status_code in (401, 403):
        raise HTTPException(503, "OCR credentials were rejected. Check the backend Space token and API key.")
    if response.status_code == 429:
        raise HTTPException(429, "The OCR service is busy. Please retry shortly.")
    if response.status_code in (400, 413, 415, 422):
        messages = {400: "The document is empty or invalid.", 413: "Maximum document size is 10 MB.",
                    415: "Choose a PDF, PNG, or JPEG document.",
                    422: "Unable to read this document. Use an unlocked PDF of at most 5 pages, or a clear image."}
        raise HTTPException(response.status_code, messages[response.status_code])
    if response.status_code in (502, 503, 504):
        raise HTTPException(503, "The OCR Space is starting or unavailable. Please retry shortly.")
    if response.status_code != 200:
        raise HTTPException(502, "The OCR Space returned an unexpected response.")
    try:
        result = response.json()
    except ValueError:
        raise HTTPException(502, "The OCR Space returned an invalid response.")
    if (not isinstance(result, dict) or not isinstance(result.get("text"), str)
            or not isinstance(result.get("markdown"), str)
            or type(result.get("page_count")) is not int or not 1 <= result["page_count"] <= 10
            or type(result.get("truncated")) is not bool or result.get("model") != MODEL_ID):
        raise HTTPException(502, "The OCR Space returned an invalid extraction result.")
    if not result["text"].strip():
        raise HTTPException(422, "No readable text was found in this document.")
    return {key: result.get(key) for key in (
        "text", "markdown", "page_count", "model", "revision", "processing_seconds", "truncated", "incomplete_pages")}


def _legacy_extract(files: dict, extension: str) -> dict:
    # Legacy use is explicit; never silently send a private document to another provider.
    if not settings.ocr_space_api_key:
        raise HTTPException(503, "The legacy OCR provider is not configured.")
    try:
        response = requests.post(OCR_SPACE_API_URL, files=files, data={
            "apikey": settings.ocr_space_api_key, "language": "eng", "filetype": extension.upper(),
            "isOverlayRequired": False, "detectOrientation": True, "scale": True, "OCREngine": 2,
        }, timeout=(10, 60))
        response.raise_for_status()
        result = response.json()
        if result.get("IsErroredOnProcessing"):
            raise HTTPException(422, "The legacy OCR provider could not read this document.")
        pages = result.get("ParsedResults", [])
        text = "\n\n".join(page.get("ParsedText", "") for page in pages).strip()
        if not text:
            raise HTTPException(422, "No readable text was found in this document.")
        return {"text": text, "markdown": text, "page_count": len(pages), "model": "OCR.space",
                "truncated": False, "incomplete_pages": []}
    except (requests.RequestException, ValueError, AttributeError, TypeError):
        raise HTTPException(503, "The legacy OCR provider is unavailable.")


def extract_text_from_image(file_bytes: bytes) -> str:
    """Compatibility for existing checks; never approve using incomplete OCR output."""
    result = extract_document(file_bytes)
    if result["truncated"]:
        raise HTTPException(422, "OCR extraction was incomplete. Use a shorter document before verification.")
    return result["text"].strip()


def calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Calculate similarity ratio between two texts using SequenceMatcher.
    Returns value between 0.0 (completely different) and 1.0 (identical).
    """
    if not text1 and not text2:
        return 1.0
    if not text1 or not text2:
        return 0.0
    
    # Normalize texts for comparison
    norm1 = _normalize_text(text1)
    norm2 = _normalize_text(text2)
    
    return SequenceMatcher(None, norm1, norm2).ratio()


def _normalize_text(text: str) -> str:
    """Normalize text for comparison by removing extra whitespace and standardizing."""
    import re
    # Remove extra whitespace, convert to lowercase
    text = re.sub(r'\s+', ' ', text.lower().strip())
    # Remove common OCR artifacts
    text = re.sub(r'[^\w\s\.\,\:\;\-\/\(\)]', '', text)
    return text


def detect_forgery(uploaded_text: str, original_text: str, threshold: float = 0.85) -> dict:
    """
    Compare uploaded document text against original preserved document.
    Returns forgery detection result with similarity score.
    """
    similarity = calculate_text_similarity(uploaded_text, original_text)
    
    is_forged = similarity < threshold
    
    # Calculate additional metrics
    uploaded_words = set(_normalize_text(uploaded_text).split())
    original_words = set(_normalize_text(original_text).split())
    
    common_words = uploaded_words & original_words
    missing_words = original_words - uploaded_words
    extra_words = uploaded_words - original_words
    
    return {
        "is_forged": is_forged,
        "similarity_score": round(similarity, 4),
        "threshold": threshold,
        "confidence": "high" if similarity > 0.95 or similarity < 0.6 else "medium",
        "analysis": {
            "common_word_count": len(common_words),
            "missing_from_uploaded": list(missing_words)[:20],  # Limit output
            "extra_in_uploaded": list(extra_words)[:20],
            "original_word_count": len(original_words),
            "uploaded_word_count": len(uploaded_words)
        }
    }


def get_document_hash(text: str) -> str:
    """Generate SHA256 hash of normalized document text for quick comparison."""
    normalized = _normalize_text(text)
    return hashlib.sha256(normalized.encode()).hexdigest()


def verify_document_structure(text: str, document_type: str) -> dict:
    """
    Verify document has expected structure/fields for its type.
    """
    fraud_score = 0
    extracted_data = {}
    text_lower = text.lower()
    
    if document_type == "death_certificate":
        if "death" not in text_lower:
            fraud_score += 40
        
        import re
        name_match = re.search(r"(?i)name\s*:\s*(.*)", text)
        date_match = re.search(r"(?i)date of death\s*:\s*(.*)", text)
        
        if name_match:
            extracted_data["name"] = name_match.group(1).strip()
        else:
            fraud_score += 30
        
        if date_match:
            extracted_data["date_of_death"] = date_match.group(1).strip()
        else:
            fraud_score += 30
    
    elif document_type == "id_proof":
        if "government" not in text_lower and "identity" not in text_lower:
            fraud_score += 40
    
    status = "approved"
    if fraud_score > 60:
        status = "rejected"
    elif fraud_score > 30:
        status = "flagged"
    
    return {
        "status": status,
        "fraud_score": fraud_score,
        "extracted_data": extracted_data
    }
