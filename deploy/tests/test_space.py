import importlib.util
import io
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "huggingface-ocr"
sys.path.insert(0, str(ROOT))
from engine import detect_media, page_images

spec = importlib.util.spec_from_file_location("trustix_ocr_space", ROOT / "app.py")
space = importlib.util.module_from_spec(spec)
spec.loader.exec_module(space)


class SpaceTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"OCR_API_KEY": "test-key"})
        self.env.start(); self.addCleanup(self.env.stop)
        self.client = TestClient(space.app)
        self.addCleanup(self.client.close)
        self.headers = {"X-Trustix-OCR-Key": "test-key"}

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["model"], "ibm-granite/granite-docling-258M")
        self.assertEqual(response.headers["cache-control"], "no-store")

    def test_service_secret_required(self):
        for headers in [{}, {"X-Trustix-OCR-Key": "wrong-key"}]:
            response = self.client.post("/ocr", files={"file": ("test.pdf", b"%PDF-test", "application/pdf")}, headers=headers)
            self.assertEqual(response.status_code, 401)

    def test_limits_and_empty_upload(self):
        response = self.client.post("/ocr", content=b"", headers={**self.headers, "Content-Length": str(space.MAX_FILE_BYTES + 65537)})
        self.assertEqual(response.status_code, 413)
        response = self.client.post("/ocr", files={"file": ("empty.pdf", b"", "application/pdf")}, headers=self.headers)
        self.assertEqual(response.status_code, 400)

    def test_conversion_and_busy_response(self):
        with patch.object(space.engine, "convert", return_value={"text": "sample"}) as convert:
            response = self.client.post("/ocr", files={"file": ("test.pdf", b"%PDF-test", "application/pdf")}, headers=self.headers)
            self.assertEqual(response.json()["text"], "sample")
            convert.assert_called_once_with(b"%PDF-test")
        with patch.object(space.engine, "convert", side_effect=HTTPException(429, "Busy")):
            self.assertEqual(self.client.post("/ocr", files={"file": ("test.pdf", b"%PDF-test")}, headers=self.headers).status_code, 429)

    def test_model_failure_does_not_expose_contents(self):
        with patch.object(space.engine, "convert", side_effect=RuntimeError("sensitive document data")):
            response = self.client.post("/ocr", files={"file": ("test.pdf", b"%PDF-test")}, headers=self.headers)
            self.assertEqual(response.status_code, 502)
            self.assertNotIn("sensitive document data", response.text)

    def test_image_decoding_and_signature_validation(self):
        with Image.new("RGB", (240, 120), "white") as image:
            buffer = io.BytesIO(); image.save(buffer, "PNG")
        self.assertEqual(detect_media(buffer.getvalue()), "image/png")
        pages = list(page_images(buffer.getvalue(), 5))
        self.assertEqual(len(pages), 1)
        self.assertEqual(pages[0].size, (240, 120))
        pages[0].close()
        for data, status in [(b"invalid", 415), (b"\x89PNG\r\n\x1a\nbroken", 422)]:
            with self.assertRaises(HTTPException) as caught:
                list(page_images(data, 5))
            self.assertEqual(caught.exception.status_code, status)


if __name__ == "__main__":
    unittest.main()
