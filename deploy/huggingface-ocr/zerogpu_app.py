"""Private Gradio API for document extraction on ZeroGPU."""
import base64
import binascii
import hmac
import os

import gradio as gr
import spaces
from fastapi import HTTPException

from engine import GraniteEngine, MAX_FILE_BYTES


if not os.getenv("OCR_API_KEY"):
    raise RuntimeError("Set the OCR_API_KEY Space secret before starting the service.")

engine = GraniteEngine()
engine.load()


@spaces.GPU(duration=180)
def extract_document(document_b64: str, api_key: str) -> dict:
    expected = os.environ["OCR_API_KEY"]
    if not hmac.compare_digest(api_key, expected):
        raise gr.Error("OCR service authorization required.")
    if len(document_b64) > (MAX_FILE_BYTES + 2) // 3 * 4 + 8:
        raise gr.Error("Maximum document size is 10 MiB.")
    try:
        data = base64.b64decode(document_b64, validate=True)
    except (ValueError, binascii.Error):
        raise gr.Error("The document encoding is invalid.") from None
    if not data or len(data) > MAX_FILE_BYTES:
        raise gr.Error("Choose a document of at most 10 MiB.")
    try:
        return engine.convert(data)
    except HTTPException as error:
        raise gr.Error(str(error.detail)) from None
    except Exception:
        raise gr.Error("Document extraction failed. Try a clearer or shorter document.") from None


demo = gr.Interface(
    fn=extract_document,
    inputs=[gr.Textbox(label="Base64-encoded document", lines=4), gr.Textbox(label="API key", type="password")],
    outputs=gr.JSON(label="Extraction"),
    api_name="ocr",
    title="Trustix OCR",
    description="Private document extraction service for the Trustix backend.",
    analytics_enabled=False,
)

if __name__ == "__main__":
    demo.queue(default_concurrency_limit=1).launch(server_name="0.0.0.0", server_port=7860, show_error=False)
