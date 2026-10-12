import os
import json
import datetime
from google.cloud import storage
from google.oauth2 import service_account
from app.config import settings

class GCSService:
    def __init__(self):
        self.project_id = settings.gcp_project_id
        self.bucket_name = settings.gcp_bucket_name
        self.client_email = settings.gcp_client_email
        self.private_key = settings.gcp_private_key.replace('\\n', '\n') if settings.gcp_private_key else ""
        
        self.credentials = None
        self.client = None
        self.bucket = None
        
        # Initialize only if credentials are provided
        if self.project_id and self.bucket_name and self.private_key:
            self._initialize_client()

    def _initialize_client(self):
        try:
            credentials_dict = {
                "type": "service_account",
                "project_id": self.project_id,
                "private_key_id": "optional-but-recommended",
                "private_key": self.private_key,
                "client_email": self.client_email,
                "client_id": "trustix-client-id",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{self.client_email}"
            }
            
            self.credentials = service_account.Credentials.from_service_account_info(credentials_dict)
            self.client = storage.Client(credentials=self.credentials, project=self.project_id)
            self.bucket = self.client.bucket(self.bucket_name)
        except Exception as e:
            print(f"Failed to initialize GCS Client: {e}")
            raise Exception(f"Failed to initialize GCS Client: {e}")

    def is_configured(self) -> bool:
        return self.bucket is not None

    def _require_configuration(self) -> None:
        if not self.is_configured():
            raise RuntimeError("Google Cloud Storage is not configured. Configure a replacement credential before using document storage.")

    def upload_file(self, destination_blob_name: str, file_bytes: bytes, content_type: str = "application/pdf") -> str:
        self._require_configuration()

        blob = self.bucket.blob(destination_blob_name)
        blob.upload_from_string(file_bytes, content_type=content_type)
        return f"gs://{self.bucket_name}/{destination_blob_name}"

    def download_file(self, blob_name: str) -> bytes:
        self._require_configuration()
            
        blob = self.bucket.blob(blob_name)
        return blob.download_as_bytes()

    def delete_file(self, blob_name: str) -> bool:
        self._require_configuration()
            
        blob = self.bucket.blob(blob_name)
        if blob.exists():
            blob.delete()
            return True
        return False

    def generate_signed_url(self, blob_name: str, expiration_minutes: int = 5) -> str:
        """
        Generates a signed URL to read a blob directly from GCS.
        (Note: Since our files are encrypted at rest, the frontend would receive an encrypted file
         if we give them a direct signed URL. Therefore, for truly zero-knowledge, we often stream the 
         decrypted file through FastAPI rather than using a direct GCS signed URL, OR we decrypt it in the browser.)
         
         For this architecture, we will stream it via FastAPI so the backend can decrypt it before sending.
         This function remains available for standard usage.
        """
        self._require_configuration()
            
        blob = self.bucket.blob(blob_name)
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=expiration_minutes),
            method="GET",
        )
        return url

# Singleton instance
gcs_service = GCSService()
