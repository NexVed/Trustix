---
title: Trustix Granite Docling OCR
colorFrom: green
colorTo: blue
sdk: gradio
sdk_version: 5.49.1
app_file: zerogpu_app.py
python_version: 3.10.13
license: apache-2.0
models:
  - ibm-granite/granite-docling-258M
---

# Trustix OCR

Private document extraction using IBM Granite Docling 258M on Gradio ZeroGPU.
Run this Space as private on `zero-a10g` and set the `OCR_API_KEY` Space secret.
Only the Trustix backend supplies the Hugging Face token and API key.

The Gradio endpoint `/ocr` accepts a base64-encoded PDF, PNG, or JPEG (at most
10 MiB) and the `OCR_API_KEY`. The backend submits requests through Gradio's
queued API. PDFs are limited to five pages. The result includes plain text,
Markdown, page count, model revision, elapsed time, and a truncation flag.
Model output is not proof of identity or document authenticity.

The model loads at startup and is placed on the shared GPU when the Gradio event
runs. A 180-second GPU duration is requested per call. Queue delays and daily
ZeroGPU quotas can prevent some requests from completing.
Optional environment variables: `OCR_MAX_PAGES` (default 5),
`OCR_MAX_NEW_TOKENS` (default 4096), `OCR_PAGE_TIMEOUT` (default 120 seconds).

The application does not intentionally save documents, but Gradio may retain
queued inputs and results temporarily. Hugging Face hosts and processes the
documents sent to this service.

Model: https://huggingface.co/ibm-granite/granite-docling-258M
