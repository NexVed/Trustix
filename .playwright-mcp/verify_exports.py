import csv
import json
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(os.environ["TEMP"]) / "trustix-pdf-tools"))
from pypdf import PdfReader
import pypdfium2 as pdfium

root = Path(__file__).resolve().parent
results = []
for name in ["overview-export.pdf", "sample-vault-backup.pdf", "asset-report.pdf", "workspace-report.pdf", "ocr-export.pdf"]:
    reader = PdfReader(root / name)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    assert "TRUSTIX" in text, name
    if name == "sample-vault-backup.pdf":
        assert "Owner secret key" in text and "PREVIEW ONLY" in text
    else:
        assert "Owner secret key" not in text
    if name == "ocr-export.pdf":
        assert "Jos\u00e9 Example" in text
    results.append({"file": name, "pages": len(reader.pages), "text_characters": len(text)})

pdf = pdfium.PdfDocument(str(root / "overview-export.pdf"))
page = pdf[0]
bitmap = page.render(scale=1.3)
bitmap.to_pil().save(root / "overview-pdf-preview.png")
bitmap.close()
page.close()
pdf.close()

data = json.loads((root / "overview-export.json").read_text(encoding="utf-8"))
assert data["sample"] is True and data["metrics"]["encrypted_assets"] == 32
rows = list(csv.reader((root / "workspace-report.csv").read_text(encoding="utf-8-sig").splitlines()))
assert any("'=SAMPLE.pdf" in row for row in rows)
print(json.dumps({"pdfs": results, "json_valid": True, "csv_formula_neutralized": True}))
