import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routes.health import router


class HealthTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def test_public_health_is_lightweight_and_not_cached(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "service": "trustix-api"})
        self.assertIn("no-store", response.headers["cache-control"])

    def test_head_probe_has_no_body(self):
        response = self.client.head("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"")


if __name__ == "__main__":
    unittest.main()
