import unittest
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routes import verification
from app.services.auth import get_current_user


class OCRRouteTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(verification.router)
        self.client = TestClient(self.app)
        self.addCleanup(self.client.close)

    def authenticate(self):
        self.app.dependency_overrides[get_current_user] = lambda: "synthetic-test-user"

    def test_unauthenticated_extraction_is_blocked(self):
        with patch.object(verification, "extract_document") as extract:
            response = self.client.post("/verification/ocr", files={"file": ("test.pdf", b"%PDF-test", "application/pdf")})
            self.assertIn(response.status_code, (401, 403))
            extract.assert_not_called()
        self.assertIn(self.client.get("/verification/ocr/status").status_code, (401, 403))

    def test_extract_returns_text_not_verification_decision(self):
        self.authenticate()
        with patch.object(verification, "extract_document", return_value={"text": "Synthetic sample", "markdown": "Synthetic sample", "truncated": False}):
            response = self.client.post("/verification/ocr", files={"file": ("test.pdf", b"%PDF-test", "application/pdf")})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["word_count"], 2)
        self.assertNotIn("verification_result", response.json())

    def test_unsupported_mime_never_reaches_provider(self):
        self.authenticate()
        with patch.object(verification, "extract_document") as extract:
            response = self.client.post("/verification/ocr", files={"file": ("bad.txt", b"bad", "text/plain")})
        self.assertEqual(response.status_code, 415)
        extract.assert_not_called()


if __name__ == "__main__":
    unittest.main()
