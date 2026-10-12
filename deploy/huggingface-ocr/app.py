import hmac
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from engine import GraniteEngine, MAX_FILE_BYTES, MODEL_ID, MODEL_REVISION

engine = GraniteEngine()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.getenv("OCR_API_KEY"):
        raise RuntimeError("Set the OCR_API_KEY Space secret before starting the service.")
    await run_in_threadpool(engine.load)
    yield


app = FastAPI(title="Trustix OCR", lifespan=lifespan, docs_url=None, redoc_url=None)


@app.middleware("http")
async def limit_upload_size(request, call_next):
    if request.method == "POST" and request.url.path == "/ocr":
        length = request.headers.get("content-length", "")
        if not length.isdigit():
            return JSONResponse({"detail": "A Content-Length header is required."}, status_code=411)
        if int(length) > MAX_FILE_BYTES + 65536:
            return JSONResponse({"detail": "Maximum upload size is 10 MiB."}, status_code=413)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


def require_key(x_trustix_ocr_key: str = Header(default="")):
    expected = os.getenv("OCR_API_KEY", "")
    if not expected or not hmac.compare_digest(x_trustix_ocr_key, expected):
        raise HTTPException(401, "OCR service authorization required.")


@app.get("/")
@app.get("/health")
def health():
    return {"ready": engine.ready, "model": MODEL_ID, "revision": MODEL_REVISION,
            "max_file_bytes": MAX_FILE_BYTES, "max_pages": engine.max_pages}


@app.post("/ocr", dependencies=[Depends(require_key)])
async def ocr(file: UploadFile = File(...)):
    try:
        data = await file.read(MAX_FILE_BYTES + 1)
        if not data:
            raise HTTPException(400, "The document is empty.")
        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(413, "Maximum upload size is 10 MiB.")
        try:
            return await run_in_threadpool(engine.convert, data)
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(502, "Document extraction failed. Try a clearer or shorter document.") from error
    finally:
        await file.close()
