import io
import os
import threading
import time
import warnings

from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError

MODEL_ID = "ibm-granite/granite-docling-258M"
MODEL_REVISION = "982fe3b40f2fa73c365bdb1bcacf6c81b7184bfe"
MAX_FILE_BYTES = 10 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 25_000_000


def detect_media(data: bytes) -> str:
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    raise HTTPException(415, "Only PDF, PNG and JPEG documents are supported.")


def page_images(data: bytes, max_pages: int):
    media_type = detect_media(data)
    if media_type == "application/pdf":
        import pypdfium2 as pdfium

        try:
            pdf = pdfium.PdfDocument(data)
        except Exception as error:
            raise HTTPException(422, "The PDF is invalid or password protected.") from error
        try:
            count = len(pdf)
            if not count or count > max_pages:
                raise HTTPException(422, f"PDFs must contain between 1 and {max_pages} pages.")
            for index in range(count):
                page = pdf[index]
                bitmap = None
                try:
                    width, height = page.get_size()
                    if min(width, height) <= 0:
                        raise HTTPException(422, "The PDF contains an invalid page.")
                    bitmap = page.render(scale=min(2.0, 1600 / max(width, height)))
                    image = bitmap.to_pil().convert("RGB")
                finally:
                    if bitmap is not None:
                        bitmap.close()
                    page.close()
                yield image
        finally:
            pdf.close()
    else:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(io.BytesIO(data)) as source:
                    image = ImageOps.exif_transpose(source).convert("RGB")
                    image.thumbnail((1600, 1600))
        except (UnidentifiedImageError, OSError, Image.DecompressionBombWarning, Image.DecompressionBombError) as error:
            raise HTTPException(422, "The image is invalid or too large to process.") from error
        yield image


class GraniteEngine:
    def __init__(self):
        self.ready = False
        self.lock = threading.Lock()
        self.max_pages = min(10, max(1, int(os.getenv("OCR_MAX_PAGES", "5"))))
        self.max_tokens = min(8192, max(256, int(os.getenv("OCR_MAX_NEW_TOKENS", "4096"))))
        self.page_timeout = min(300, max(10, int(os.getenv("OCR_PAGE_TIMEOUT", "120"))))

    def load(self):
        import torch
        from transformers import AutoModelForVision2Seq, AutoProcessor

        torch.set_num_threads(min(4, max(1, int(os.getenv("OMP_NUM_THREADS", "2")))))
        self.device = os.getenv("OCR_DEVICE", "cuda")
        self.processor = AutoProcessor.from_pretrained(MODEL_ID, revision=MODEL_REVISION)
        self.model = AutoModelForVision2Seq.from_pretrained(
            MODEL_ID, revision=MODEL_REVISION,
            torch_dtype=torch.bfloat16 if self.device == "cuda" else torch.float32,
            _attn_implementation="sdpa",
        ).to(self.device).eval()
        self.ready = True

    def convert(self, data: bytes) -> dict:
        import torch
        from docling_core.types.doc import DoclingDocument
        from docling_core.types.doc.document import DocTagsDocument

        if not self.ready:
            raise HTTPException(503, "The OCR model is still loading.")
        if not self.lock.acquire(blocking=False):
            raise HTTPException(429, "OCR is processing another document. Please try again shortly.")
        started = time.monotonic()
        images, doctags, incomplete = [], [], []
        try:
            messages = [{"role": "user", "content": [
                {"type": "image"}, {"type": "text", "text": "Convert this page to docling."},
            ]}]
            prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
            end_tokens = self.model.generation_config.eos_token_id
            end_tokens = set(end_tokens if isinstance(end_tokens, list) else [end_tokens])
            for index, image in enumerate(page_images(data, self.max_pages)):
                images.append(image)
                inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.device)
                with torch.inference_mode():
                    output = self.model.generate(
                        **inputs, do_sample=False, max_new_tokens=self.max_tokens,
                        max_time=self.page_timeout,
                    )
                generated = output[:, inputs.input_ids.shape[1]:].cpu()
                if generated.shape[1] == 0 or int(generated[0, -1]) not in end_tokens:
                    incomplete.append(index + 1)
                doctags.append(self.processor.batch_decode(generated, skip_special_tokens=False)[0].lstrip())
            parsed = DocTagsDocument.from_doctags_and_image_pairs(doctags, images)
            document = DoclingDocument.load_from_doctags(parsed, document_name="Document")
            return {
                "text": document.export_to_text(traverse_pictures=True).strip(),
                "markdown": document.export_to_markdown(traverse_pictures=True).strip(),
                "page_count": len(images), "model": MODEL_ID, "revision": MODEL_REVISION,
                "processing_seconds": round(time.monotonic() - started, 2),
                "truncated": bool(incomplete), "incomplete_pages": incomplete,
            }
        finally:
            for image in images:
                image.close()
            self.lock.release()
