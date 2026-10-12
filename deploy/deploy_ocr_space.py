"""Create a private Gradio ZeroGPU Space and configure the local backend."""
import argparse
import os
from pathlib import Path
import secrets


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-id", required=True, help="Confirmed owner/trustix-granite-docling-ocr")
    parser.add_argument("--configure-backend", action="store_true")
    parser.add_argument("--update", action="store_true", help="Update an existing Trustix ZeroGPU Space")
    args = parser.parse_args()
    from huggingface_hub import HfApi
    from huggingface_hub.utils import HfHubHTTPError

    token_path = Path(os.environ.get("HF_TOKEN_PATH", Path.home() / ".cache/huggingface/token"))
    token = os.environ.get("HF_TOKEN") or (token_path.read_text().strip() if token_path.exists() else "")
    if not token:
        parser.error("Sign in to Hugging Face with a write token before deploying.")
    api = HfApi(token=token)
    identity = api.whoami()
    if "/" not in args.repo_id or identity["name"] != args.repo_id.split("/", 1)[0]:
        parser.error("The requested Space owner must match the authenticated personal account.")
    root = Path(__file__).resolve().parent
    api_key = os.environ.get("HF_OCR_API_KEY") or secrets.token_urlsafe(32)
    if not args.configure_backend and not os.environ.get("HF_OCR_API_KEY"):
        parser.error("Use --configure-backend, or provide HF_OCR_API_KEY so the matching key is available to your backend.")
    try:
        if args.update:
            info = api.space_info(args.repo_id)
            if not info.private or info.sdk != "gradio":
                parser.error("Refusing to update a public or non-Gradio Space.")
            from huggingface_hub import hf_hub_download
            readme = Path(hf_hub_download(args.repo_id, "README.md", repo_type="space", token=token)).read_text()
            if "title: Trustix Granite Docling OCR" not in readme:
                files = sorted(api.list_repo_files(args.repo_id, repo_type="space"))
                is_empty_space = (files == [".gitattributes", "README.md"]
                                  and getattr(info.runtime, "stage", None) == "NO_APP_FILE"
                                  and getattr(info.runtime, "requested_hardware", None) == "zero-a10g")
                if not is_empty_space:
                    parser.error("Refusing to overwrite an unrelated Space.")
        else:
            api.create_repo(args.repo_id, repo_type="space", space_sdk="gradio", private=True,
                            space_hardware="zero-a10g", exist_ok=False)
        api.add_space_secret(args.repo_id, "OCR_API_KEY", api_key)
        api.upload_folder(repo_id=args.repo_id, repo_type="space", folder_path=str(root / "huggingface-ocr"),
            allow_patterns=["zerogpu_app.py", "engine.py", "requirements.txt", "README.md"],
            commit_message="Deploy Trustix Granite Docling OCR service")
        info = api.space_info(args.repo_id)
        host = getattr(info, "host", None)
        if args.configure_backend:
            if not host:
                raise RuntimeError("Space created but its host is not available yet. Re-run with --update once available.")
            from dotenv import set_key
            env = root.parent / "backend/.env"
            values = {"OCR_PROVIDER": "granite_docling", "HF_OCR_URL": host if host.startswith("https://") else f"https://{host}",
                      "HF_OCR_API_KEY": api_key, "HF_OCR_TIMEOUT_SECONDS": "600"}
            if os.environ.get("HF_TOKEN"):
                values["HF_TOKEN"] = token
                values["HF_TOKEN_PATH"] = ""
            else:
                values["HF_TOKEN_PATH"] = str(token_path.resolve())
                values["HF_TOKEN"] = ""
            for key, value in values.items():
                set_key(str(env), key, value)
        print(f"Space: https://huggingface.co/spaces/{args.repo_id}")
        print("Private ZeroGPU deployment submitted. Check build/runtime before using OCR.")
        if args.configure_backend:
            print("Backend environment configured. Restart the backend after the Space is ready.")
        else:
            print("API key is stored as a Space secret. Configure the backend with a matching key before use.")
    except HfHubHTTPError as error:
        status = error.response.status_code if error.response is not None else "unknown"
        if status == 402:
            raise SystemExit("Hugging Face declined ZeroGPU hosting for this account (HTTP 402). Verify email, account age, or Space quota. No paid hardware was requested.") from None
        raise SystemExit(f"Hugging Face deployment failed (HTTP {status}). Check account eligibility and Space permissions.") from None


if __name__ == "__main__":
    main()
