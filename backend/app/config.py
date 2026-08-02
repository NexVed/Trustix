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

    # Infura & Polygon Settings
    infura_api_key: str = ""
    infura_project_secret: str = ""
    polygon_rpc_url: str = ""
    polygon_amoy_rpc_url: str = ""
    polygon_chain_id: int = 137
    polygon_amoy_chain_id: int = 80002


    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def jwt_secret(self) -> str:
        return self.supabase_jwt_secret or self.supabase_jwt_key

settings = Settings()
