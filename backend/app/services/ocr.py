import os
import requests
from fastapi import HTTPException
from difflib import SequenceMatcher
import hashlib

OCR_SPACE_API_URL = "https://api.ocr.space/parse/image"
OCR_SPACE_API_KEY = os.environ.get("OCR_SPACE_API_KEY", "")

def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Extracts text from an image using OCR.space API.
    """
    if not OCR_SPACE_API_KEY:
        raise HTTPException(status_code=500, detail="OCR.space API key not configured.")
    
    try:
        files = {"file": ("image.jpg", file_bytes, "image/jpeg")}
        data = {
            "apikey": OCR_SPACE_API_KEY,
            "language": "eng",
            "isOverlayRequired": False,
            "filetype": "JPG",
            "detectOrientation": True,
            "scale": True,
            "OCREngine": 2
        }
        
        response = requests.post(OCR_SPACE_API_URL, files=files, data=data, timeout=30)
        response.raise_for_status()
        result = response.json()
        
        if result.get("IsErroredOnProcessing"):
            error_msg = result.get("ErrorMessage", ["Unknown OCR error"])[0]
            raise HTTPException(status_code=500, detail=f"OCR processing failed: {error_msg}")
        
        parsed_results = result.get("ParsedResults", [])
        if not parsed_results:
            return ""
        
        return parsed_results[0].get("ParsedText", "").strip()
    
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"OCR service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


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