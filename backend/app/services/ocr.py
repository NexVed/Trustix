import os
from google.cloud import vision
from fastapi import HTTPException

def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Extracts text from an image using Google Cloud Vision API.
    """
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        raise HTTPException(status_code=500, detail="Google Cloud Vision credentials are not configured.")
        
    try:
        # Client initializes automatically using GOOGLE_APPLICATION_CREDENTIALS env var
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=file_bytes)
        response = client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(response.error.message)

        texts = response.text_annotations
        if not texts:
            return ""

        return texts[0].description  # Full detected text

    except Exception as e:
        # Disable debug logging of the actual document text; handle error securely
        raise HTTPException(status_code=500, detail="OCR processing failed. Consult server logs if issue persists.")