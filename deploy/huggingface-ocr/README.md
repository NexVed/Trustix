---
title: Trustix Granite Docling OCR
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
license: apache-2.0
models:
  - ibm-granite/granite-docling-258M
---

# Trustix OCR

Private document extraction using IBM Granite Docling 258M. Run this Space as
private and set the `OCR_API_KEY` Space secret. The Trustix backend supplies both
Hugging Face authorization and `X-Trustix-OCR-Key`; browsers never receive them.

`POST /ocr` accepts one multipart `file` (PDF, PNG or JPEG, at most 10 MiB).
PDFs are limited to five pages. The response includes plain text, Markdown,
page count, model revision, elapsed time and a truncation flag. Model output is
extracted content, not proof of identity or document authenticity.

`GET /health` reports whether the model is loaded. The model loads once at
startup. CPU inference can be slow, and sleeping Spaces need time to wake up.
Optional environment variables: `OCR_MAX_PAGES` (default 5),
`OCR_MAX_NEW_TOKENS` (default 4096), `OCR_PAGE_TIMEOUT` (default 120 seconds).

The service closes uploaded files after processing and does not save documents
or extracted text. No request-body or document-content logging is enabled.
Hugging Face still hosts and processes the documents sent to this service.

Model: https://huggingface.co/ibm-granite/granite-docling-258M
