from app.routes import vault, nominee, trigger, wallet, verification, profile
from app.config import settings

app = FastAPI(
    title="TRUSTIX Backend API MVP",
    description="AI-powered digital inheritance vault backend.",
    version="1.0.0"
)

# Secure CORS middleware to allow only Vercel frontend requests via env variable
allowed_origins = [settings.frontend_url] if settings.frontend_url else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include endpoint routers
app.include_router(vault.router)
app.include_router(nominee.router)
app.include_router(trigger.router)
app.include_router(wallet.router)
app.include_router(verification.router)
app.include_router(profile.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the TRUSTIX MVP API."
    }
