import uuid
from google.cloud import storage
from app.config import settings
from fastapi import HTTPException

def upload_encrypted_vault(data: bytes, user_id: str) -> str:
    """
    Uploads the encrypted vault data to Google Cloud Storage.
    Returns the file URL.
    """
    if not settings.google_cloud_bucket or not settings.google_application_credentials:
        raise HTTPException(status_code=500, detail="Google Cloud Storage is not configured properly.")

    try:
        client = storage.Client()
        bucket = client.bucket(settings.google_cloud_bucket)
        
        file_name = f"vaults/{user_id}/{uuid.uuid4()}.bin"
        blob = bucket.blob(file_name)
        
        # Upload from memory
        blob.upload_from_string(data, content_type="application/octet-stream")
        
        # Return public url path
        return f"https://storage.googleapis.com/{settings.google_cloud_bucket}/{file_name}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GCS Upload failed: {str(e)}")
