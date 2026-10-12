from pydantic_settings import BaseSettings
import os
import json

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_jwt_key: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    google_cloud_bucket: str = ""
    google_application_credentials: str = ""
    gcp_project_id: str = ""
    gcp_bucket_name: str = ""
    gcp_client_email: str = ""
    gcp_private_key: str = ""
    frontend_url: str = ""

    # Infura & Polygon Settings
    infura_api_key: str = ""
    infura_project_secret: str = ""
    polygon_rpc_url: str = ""
    polygon_amoy_rpc_url: str = ""
    polygon_chain_id: int = 137
    polygon_amoy_chain_id: int = 80002

    # OCR credentials stay on the backend, never in NEXT_PUBLIC variables.
    ocr_provider: str = "granite_docling"
    hf_ocr_url: str = ""
    hf_token: str = ""
    hf_token_path: str = ""
    hf_ocr_api_key: str = ""
    hf_ocr_timeout_seconds: int = 600
    ocr_space_api_key: str = ""

    # Resend Email Settings
    resend_api_key: str = ""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Auto-populate GCP settings from GOOGLE_APPLICATION_CREDENTIALS JSON file
        if self.google_application_credentials and os.path.exists(self.google_application_credentials):
            try:
                with open(self.google_application_credentials, 'r') as f:
                    creds = json.load(f)
                    if not self.gcp_project_id:
                        self.gcp_project_id = creds.get("project_id", "")
                    if not self.gcp_client_email:
                        self.gcp_client_email = creds.get("client_email", "")
                    if not self.gcp_private_key:
                        self.gcp_private_key = creds.get("private_key", "")
            except Exception:
                pass
        
        # Fallback: use GOOGLE_CLOUD_BUCKET for gcp_bucket_name
        if not self.gcp_bucket_name and self.google_cloud_bucket:
            self.gcp_bucket_name = self.google_cloud_bucket

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def jwt_secret(self) -> str:
        return self.supabase_jwt_secret or self.supabase_jwt_key

settings = Settings()
