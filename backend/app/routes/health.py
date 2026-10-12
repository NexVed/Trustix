from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["Health"])


@router.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    """Process liveness only: no database queries, model calls, or private data."""
    return JSONResponse(
        {"status": "ok", "service": "trustix-api"},
        headers={"Cache-Control": "no-store, max-age=0"},
    )
