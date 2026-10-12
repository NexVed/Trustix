export function serializeCsv(rows: (string | number)[][]): string {
  return rows.map(row => row.map(value => {
    const text = String(value);
    // Neutralize spreadsheet formulas in user-supplied document and event names.
    const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
}

export function downloadBlob(filename: string, blob: Blob) {
  if (!blob.size) throw new Error("The file is empty. Please try again.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = Array.from(filename.replace(/[<>:"/\\|?*]/g, "_"))
    .map(character => character.charCodeAt(0) < 32 ? "_" : character).join("") || "trustix-download";
  const extension = safeName.match(/\.[a-z0-9]{1,8}$/i)?.[0] || "";
  link.download = safeName.length > 200 ? safeName.slice(0, 200 - extension.length) + extension : safeName;
  link.hidden = true;
  document.body.appendChild(link);
  try { link.click(); }
  finally {
    link.remove();
    // Keep the URL alive while the browser starts saving, including mobile Safari.
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  downloadBlob(filename, new Blob(["\uFEFF", serializeCsv(rows)], { type: "text/csv;charset=utf-8" }));
}

export function downloadJson(filename: string, data: unknown) {
  downloadBlob(filename, new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }));
}

export async function downloadPdf(filename: string, report: import("./workspace-pdf").PdfReport) {
  const { createReportPdf } = await import("./workspace-pdf");
  downloadBlob(filename, new Blob([await createReportPdf(report)], { type: "application/pdf" }));
}
