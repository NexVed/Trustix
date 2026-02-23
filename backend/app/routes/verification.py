from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Query
from app.services.auth import get_current_user
from app.services.ocr import extract_text_from_image
from app.services.verification import verify_document

router = APIRouter(prefix="/verification", tags=["Verification"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}

@router.post("/document")
async def verify_uploaded_document(
    document_type: str = Query(..., pattern="^(death_certificate|id_proof)$"),
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Secure file drop endpoint for document verification via OCR.
    Processes the file in-memory and returns fraud analysis. 
    Does not store the file permanently or log sensitive contents.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are allowed.")

    file_bytes = await file.read()
    
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # OCR Extraction in memory
    extracted_text = extract_text_from_image(file_bytes)

    # Verification Logic
    result = verify_document(extracted_text, document_type)

    return {
        "user_id": user_id,
        "verification_result": result
    }
