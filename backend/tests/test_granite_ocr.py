import unittest
import base64
import json
from unittest.mock import MagicMock, Mock, patch

import requests
from fastapi import HTTPException
from app.services import ocr


class GraniteOCRTests(unittest.TestCase):
    def setUp(self):
        self.config = patch.multiple(ocr.settings, ocr_provider="granite_docling",
            hf_ocr_url="https://example-trustix-ocr.hf.space", hf_token="test-private-token",
            hf_token_path="", hf_ocr_api_key="test-service-key", hf_ocr_timeout_seconds=600)
        self.config.start()
        self.addCleanup(self.config.stop)
        self.result = {"text": "TRUSTIX SAMPLE", "markdown": "# TRUSTIX SAMPLE", "page_count": 1,
            "model": ocr.MODEL_ID, "truncated": False, "incomplete_pages": [], "processing_seconds": 1.2}

    def response(self, code=200):
        response = Mock(status_code=code)
        response.json.return_value = {"event_id": "synthetic-event"}
        return response

    def stream(self, code=200, result=None):
        response = MagicMock(status_code=code)
        response.__enter__.return_value = response
        response.iter_lines.return_value = ["event: complete", "data: " + json.dumps([result or self.result])]
        return response

    def assert_error(self, code, fn, *args):
        with self.assertRaises(HTTPException) as caught:
            fn(*args)
        self.assertEqual(caught.exception.status_code, code)
        return caught.exception

    @patch.object(ocr.requests, "get")
    @patch.object(ocr.requests, "post")
    def test_private_headers_and_correct_file_types(self, post, get):
        post.return_value = self.response()
        get.return_value = self.stream()
        for data in [b"%PDF-sample", b"\x89PNG\r\n\x1a\nsample", b"\xff\xd8\xffsample"]:
            self.assertEqual(ocr.extract_document(data)["text"], "TRUSTIX SAMPLE")
            kwargs = post.call_args.kwargs
            self.assertEqual(kwargs["json"]["data"][0], base64.b64encode(data).decode())
            self.assertEqual(kwargs["json"]["data"][1], "test-service-key")
            self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-private-token")
            self.assertEqual(post.call_args.args[0], "https://example-trustix-ocr.hf.space/gradio_api/call/ocr")
            self.assertEqual(get.call_args.args[0], "https://example-trustix-ocr.hf.space/gradio_api/call/ocr/synthetic-event")
            self.assertFalse(kwargs["allow_redirects"])

    @patch.object(ocr.requests, "post")
    def test_invalid_files_never_leave_backend(self, post):
        for code, data in [(400, b""), (415, b"not an image"), (413, b"x" * (ocr.MAX_FILE_BYTES + 1))]:
            self.assert_error(code, ocr.extract_document, data)
        post.assert_not_called()

    @patch.object(ocr.requests, "post")
    def test_upstream_status_mapping(self, post):
        for upstream, expected in [(401, 503), (403, 503), (429, 429), (422, 502),
                                   (413, 502), (503, 503), (302, 502), (500, 502)]:
            post.return_value = self.response(upstream)
            error = self.assert_error(expected, ocr.extract_document, b"%PDF-sample")
            self.assertNotIn("test-private-token", error.detail)

    @patch.object(ocr.requests, "post")
    def test_network_failures_are_sanitized(self, post):
        for error, status in [(requests.Timeout("secret"), 504), (requests.ConnectionError("secret"), 503)]:
            post.side_effect = error
            caught = self.assert_error(status, ocr.extract_document, b"%PDF-sample")
            self.assertNotIn("secret", caught.detail)

    @patch.object(ocr.requests, "get")
    @patch.object(ocr.requests, "post")
    def test_malformed_empty_and_partial_results(self, post, get):
        response = self.response(); post.return_value = response
        response.json.side_effect = ValueError("bad json")
        self.assert_error(502, ocr.extract_document, b"%PDF-sample")
        response.json.side_effect = None
        response.json.return_value = {"event_id": "../not-an-id"}
        self.assert_error(502, ocr.extract_document, b"%PDF-sample")
        response.json.return_value = {"event_id": "synthetic-event"}
        for key, value in [("text", 12), ("markdown", None), ("page_count", True),
                           ("truncated", "false"), ("model", "another-model")]:
            get.return_value = self.stream(result={**self.result, key: value})
            self.assert_error(502, ocr.extract_document, b"%PDF-sample")
        get.return_value = self.stream(result={**self.result, "text": "  "})
        self.assert_error(422, ocr.extract_document, b"%PDF-sample")
        get.return_value = self.stream(result={**self.result, "truncated": True})
        self.assertTrue(ocr.extract_document(b"%PDF-sample")["truncated"])
        self.assert_error(422, ocr.extract_text_from_image, b"%PDF-sample")

    @patch.object(ocr.requests, "get")
    @patch.object(ocr.requests, "post")
    def test_zero_gpu_queue_errors_are_sanitized(self, post, get):
        post.return_value = self.response()
        stream = self.stream()
        get.return_value = stream
        stream.iter_lines.return_value = ["event: error", "data: ZeroGPU quota exceeded: private details"]
        self.assert_error(429, ocr.extract_document, b"%PDF-sample")

    @patch.object(ocr.requests, "post")
    def test_no_credentials_no_request_and_no_fallback(self, post):
        with patch.object(ocr.settings, "hf_token", ""):
            self.assertFalse(ocr.get_ocr_status()["configured"])
            self.assert_error(503, ocr.extract_document, b"%PDF-sample")
        post.assert_not_called()

    @patch.object(ocr.requests, "post")
    def test_space_url_must_be_trusted_https_origin(self, post):
        for url in ["http://example.hf.space", "https://example.hf.space.evil.test", "https://user:pass@example.hf.space",
                    "https://example.hf.space/ocr", "https://example.hf.space?token=secret", "https://example.hf.space:invalid"]:
            with patch.object(ocr.settings, "hf_ocr_url", url):
                self.assert_error(503, ocr.extract_document, b"%PDF-sample")
        post.assert_not_called()

    def test_status_does_not_expose_credentials(self):
        status = ocr.get_ocr_status()
        self.assertTrue(status["configured"])
        self.assertNotIn("test-private-token", str(status))
        self.assertNotIn("test-service-key", str(status))


if __name__ == "__main__":
    unittest.main()
