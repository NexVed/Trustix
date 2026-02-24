from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import vault, nominee, trigger, wallet, verification, profile, dashboard, documents, zerodha
from app.routes import auth_routes
from app.config import settings
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.routes import zk_vault

app = FastAPI(
    title="TRUSTIX Backend API MVP",
    description="AI-powered digital inheritance vault backend.",
    version="1.0.0"
)

app.state.limiter = zk_vault.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Secure CORS middleware — allow local dev frontend + configured frontend URL
allowed_origins = ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"]
if settings.frontend_url:
    allowed_origins.append(settings.frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include endpoint routers
app.include_router(auth_routes.router)
app.include_router(vault.router)
app.include_router(nominee.router)
app.include_router(trigger.router)
app.include_router(wallet.router)
app.include_router(verification.router)
app.include_router(profile.router)
app.include_router(zk_vault.router)
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(documents.router)
app.include_router(zerodha.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the TRUSTIX MVP API."
    }
