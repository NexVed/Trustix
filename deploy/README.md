# Private Granite Docling OCR on ZeroGPU

The `huggingface-ocr` directory is a standalone Gradio ZeroGPU Space for the pinned
`ibm-granite/granite-docling-258M` model. The Trustix backend proxies requests;
the browser never receives Hugging Face credentials. Model dependencies are
installed in the Space, not in the Trustix backend.

## Deploy

Use a Hugging Face write token for the **confirmed Space owner**. Install the
deployment tools in an isolated environment, not the backend environment.
From the repository root:

```powershell
backend\venv\Scripts\python.exe -m venv deploy\.venv
deploy\.venv\Scripts\python.exe -m pip install huggingface_hub python-dotenv
deploy\.venv\Scripts\python.exe deploy\deploy_ocr_space.py --repo-id YOUR_ACCOUNT/trustix-granite-docling-ocr --configure-backend
```

The helper creates a **private** Gradio Space on ZeroGPU, adds an independent
`OCR_API_KEY` secret and uploads only the four service files. It never requests
paid hardware. Free personal accounts need a verified email, age over 30 days,
and an available ZeroGPU Space slot.
An existing repository is not overwritten unless `--update` is supplied and
its README identifies it as this Trustix OCR service.

The local backend may use the cached Hugging Face token via `HF_TOKEN_PATH`.
For a hosted backend, use a least-privilege read token with access to the Space
as `HF_TOKEN`, plus `HF_OCR_URL` and `HF_OCR_API_KEY`. Never expose these through
`NEXT_PUBLIC_*` or commit `.env` files. Replace the local write token with a read
token after deployment. Restart the backend after changing its environment.

## API and Limits

- `GET /verification/ocr/status`: authenticated configuration status, not a live readiness probe.
- `POST /verification/ocr`: authenticated multipart `file`, returns text, Markdown,
  page count, model revision, timing and truncation information.
- PDF, PNG and JPEG are checked by file signature; maximum 10 MiB and 5 PDF pages.
- The Space queues one inference at a time; ZeroGPU queue and daily quota limits apply.
- The client does not automatically retry uploads. Sleeping Spaces can take minutes to start.
- Cancelling the browser request stops waiting; work already queued or running
  in the Space may continue until completion or its GPU duration limit.
- The OCR endpoint does not deliberately persist document contents. Gradio's
  queue may temporarily retain inputs and results. No content is included in application logs.
- Extraction output can be inaccurate. It is not evidence of identity or authenticity.
  Existing legacy verification rules are not strengthened by changing OCR models.
- Incomplete output is shown with a warning; existing verification callers reject it.
- `OCR_PROVIDER=ocr_space` explicitly opts into the legacy provider. No fallback sends
  documents to another provider without that configuration.

## Verify

```powershell
cd backend
venv\Scripts\python.exe -m unittest discover -s tests -p test_granite_ocr.py -v
```

Check Space runtime is `RUNNING`, then send a synthetic, non-sensitive PNG via
the authenticated Trustix `/verification/ocr` endpoint. Confirm the returned
model ID and visible sample words before sending real documents.
