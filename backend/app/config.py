from pydantic_settings import BaseSettings

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

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def jwt_secret(self) -> str:
        return self.supabase_jwt_secret or self.supabase_jwt_key

settings = Settings()
