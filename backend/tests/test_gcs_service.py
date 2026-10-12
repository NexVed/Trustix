import unittest

from app.services.gcs_service import GCSService


class GCSServiceTests(unittest.TestCase):
    def test_unconfigured_storage_fails_closed(self):
        service = GCSService.__new__(GCSService)
        service.bucket = None

        operations = (
            lambda: service.upload_file("document", b"encrypted"),
            lambda: service.download_file("document"),
            lambda: service.delete_file("document"),
            lambda: service.generate_signed_url("document"),
        )

        for operation in operations:
            with self.assertRaisesRegex(RuntimeError, "not configured"):
                operation()


if __name__ == "__main__":
    unittest.main()
