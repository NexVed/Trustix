import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmptyState, PageHeader, PanelHeading } from "@/components/WorkspacePage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useVault } from "@/contexts/VaultContext";
import { useToast } from "@/hooks/use-toast";
import { downloadBlob, downloadPdf } from "@/lib/workspace-export";
import { Upload, FileText, Loader2, ScanLine, ArrowUpRight, Copy, Download, X, AlertCircle } from "lucide-react";

interface OCRResult {
  text: string; markdown: string; page_count: number; model: string;
  word_count: number; processing_seconds?: number; truncated: boolean;
}
interface OCRStatus { configured: boolean; model: string; }
const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AIVerification() {
  const { session } = useAuth();
  const { token, role } = useVault();
  const authToken = session?.access_token || token;
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [status, setStatus] = useState<OCRStatus | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [format, setFormat] = useState<"text" | "markdown">("text");
  const input = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const canExtract = !!authToken && status?.configured === true;
  const content = result?.[format] || "";

  useEffect(() => {
    const controller = new AbortController();
    setStatus(null); setResult(null); setFile(null); setError(""); setSaved(false); setProcessing(false); setSaving(false);
    if (authToken) {
      void fetch(`${api}/verification/ocr/status`, {
        headers: { Authorization: `Bearer ${authToken}` }, signal: controller.signal,
      }).then(async response => {
        if (!response.ok) throw new Error("Could not check OCR configuration. Check your session and backend connection.");
        const data = await response.json();
        if (!controller.signal.aborted) setStatus(data);
      }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "OCR status is unavailable."); });
    }
    return () => { controller.abort(); activeRequest.current?.abort(); activeRequest.current = null; };
  }, [authToken]);

  const selectFile = (selected: File) => {
    if (processing || saving) return;
    setError(""); setResult(null); setSaved(false);
    if (!/\.(pdf|png|jpe?g)$/i.test(selected.name) || !selected.size || selected.size > 10 * 1024 * 1024) {
      setFile(null); setError("Choose a non-empty PDF, PNG, or JPEG smaller than 10 MB."); return;
    }
    setFile(selected);
  };

  const extract = async () => {
    if (!file || !canExtract || processing) return;
    const controller = new AbortController(); activeRequest.current = controller;
    const timer = setTimeout(() => controller.abort(), 910_000);
    setProcessing(true); setResult(null); setError("");
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch(`${api}/verification/ocr`, {
        method: "POST", headers: { Authorization: `Bearer ${authToken}` }, body, signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Document extraction failed.");
      if (typeof data.text !== "string" || typeof data.markdown !== "string") throw new Error("The service returned an invalid result.");
      if (!controller.signal.aborted) { setResult(data); setFormat("text"); }
    } catch (e) {
      if (activeRequest.current === controller) setError(controller.signal.aborted ? "Extraction was cancelled or timed out. You can retry." : e instanceof Error ? e.message : "Unable to extract this document.");
    } finally {
      clearTimeout(timer);
      if (activeRequest.current === controller) { activeRequest.current = null; setProcessing(false); }
    }
  };

  const saveToVault = async () => {
    if (!file || !token || role !== "owner" || saving) return;
    setSaving(true); setError("");
    const controller = new AbortController(); activeRequest.current = controller;
    try {
      const body = new FormData(); body.append("file", file); body.append("category", "legal_contracts");
      const response = await fetch(`${api}/documents/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body, signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Vault upload failed.");
      if (!controller.signal.aborted) { setSaved(true); toast({ title: "Document saved to vault" }); }
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to save document."); }
    finally { if (activeRequest.current === controller) { activeRequest.current = null; setSaving(false); } }
  };

  const download = () => {
    try {
      downloadBlob(`${file?.name.replace(/\.[^.]+$/, "") || "document"}.${format === "text" ? "txt" : "md"}`,
        new Blob([content], { type: format === "text" ? "text/plain;charset=utf-8" : "text/markdown;charset=utf-8" }));
    } catch { setError("The extracted content could not be downloaded. Please retry."); }
  };

  const exportPdf = async () => {
    if (!result || exporting) return;
    setExporting(true); setError("");
    try {
      await downloadPdf(`${file?.name.replace(/\.[^.]+$/, "") || "document"}-ocr.pdf`, {
        title: "Document OCR extraction",
        notice: result.truncated ? "INCOMPLETE EXTRACTION. Some pages reached the processing limit. Review the partial text; OCR does not establish authenticity." : "OCR results may contain errors. Text extraction does not establish document authenticity or identity.",
        sections: [
          { title: "Document details", columns: ["Field", "Value"], rows: [["File", file?.name || "Document"], ["Model", result.model], ["Pages", result.page_count], ["Words", result.word_count]] },
          { title: "Extracted text", columns: ["Content"], rows: result.text.split(/\n\s*\n/).map(paragraph => [paragraph]) },
        ],
      });
    } catch { setError("The PDF could not be created. Please retry."); }
    finally { setExporting(false); }
  };

  return <DashboardLayout><div className="ws-page">
    <PageHeader title="Document OCR" description="Extract readable text and structured Markdown from your documents." actions={<Link href="/asset-vault" className="tx-button"><FileText size={14} />Document library<ArrowUpRight size={14} /></Link>} />
    {!authToken && <div className="ws-error" role="status">Sign in or unlock your vault to extract documents. <Link href="/auth">Sign in</Link></div>}
    {status && !status.configured && <div className="ws-error" role="status">The private OCR Space is not configured on the backend yet.</div>}
    <div className="ws-two-column">
      <section className="card-enterprise">
        <PanelHeading title="Document intake" description="PDF, PNG, JPEG / 10 MB / up to 5 pages" action={<ScanLine size={18} />} />
        <div className={`ws-dropzone ${dragging ? "is-dragging" : ""}`}
          onDragOver={e => { e.preventDefault(); if (!processing && !saving) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) selectFile(e.dataTransfer.files[0]); }}>
          {processing ? <Loader2 size={36} className="animate-spin" /> : <Upload size={36} strokeWidth={1.5} />}
          <strong className="max-w-full break-all">{processing ? "Extracting document..." : file ? file.name : "Select a document"}</strong>
          <p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF documents and scanned images"}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" disabled={processing || saving} onClick={() => input.current?.click()}><Upload size={14} />{file ? "Change file" : "Choose file"}</Button>
            <Button size="sm" disabled={!file || !canExtract || processing || saving} onClick={() => void extract()}><ScanLine size={14} />Extract text</Button>
            {processing && <Button size="sm" variant="outline" onClick={() => activeRequest.current?.abort()}><X size={14} />Cancel</Button>}
          </div>
          <input hidden type="file" accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" ref={input} onChange={e => { const selected = e.target.files?.[0]; if (selected) selectFile(selected); e.target.value = ""; }} />
        </div>
        <p className="px-5 pb-5 text-xs text-muted-foreground">Extracting sends this document to your private Hugging Face OCR service. It is not saved to your vault unless you choose to save it.</p>
      </section>
      <section className="card-enterprise">
        <PanelHeading title="Extraction details" description={status?.model || "IBM Granite Docling 258M"} />
        <dl className="ws-detail-list pb-5">
          <div className="ws-record"><dt>Status</dt><dd aria-live="polite">{processing ? "Processing; a sleeping Space may take a few minutes" : result ? result.truncated ? "Incomplete; review required" : "Text extracted" : "Awaiting document"}</dd></div>
          <div className="ws-record"><dt>Pages</dt><dd>{result?.page_count ?? "-"}</dd></div>
          <div className="ws-record"><dt>Words</dt><dd>{result?.word_count ?? "-"}</dd></div>
          <div className="ws-record"><dt>Processing time</dt><dd>{result?.processing_seconds != null ? `${result.processing_seconds}s` : "-"}</dd></div>
          <div className="ws-record"><dt>Authenticity</dt><dd>Not assessed. OCR is text extraction, not identity verification.</dd></div>
        </dl>
        {result && file?.name.toLowerCase().endsWith(".pdf") && token && role === "owner" && <div className="px-5 pb-5"><Button variant="outline" size="sm" disabled={saving || saved} onClick={() => void saveToVault()}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{saved ? "Saved to vault" : "Save PDF to vault"}</Button></div>}
      </section>
    </div>
    {error && <div className="ws-error" role="alert">{error}</div>}
    {result?.truncated && <div className="ws-error" role="alert"><AlertCircle size={16} />Some pages reached the extraction limit. Review the partial result and retry with a shorter document.</div>}
    <section className="card-enterprise min-w-0">
      <PanelHeading title="Extracted content" description={file?.name || "Awaiting a document"} action={result && <div className="flex gap-2">
        <Button size="icon" variant="outline" title="Copy extracted content" aria-label="Copy extracted content" onClick={() => void navigator.clipboard.writeText(content).then(() => toast({ title: "Content copied" })).catch(() => setError("Clipboard access is unavailable."))}><Copy size={14} /></Button>
        <Button size="icon" variant="outline" title="Download extracted content" aria-label="Download extracted content" onClick={download}><Download size={14} /></Button>
        <Button size="icon" variant="outline" disabled={exporting} title="Download OCR PDF" aria-label="Download OCR PDF" onClick={() => void exportPdf()}>{exporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}</Button>
      </div>} />
      {result ? <div className="p-5 pt-0">
        <div className="flex gap-1 pb-4" role="tablist" aria-label="Extraction format">
          <Button role="tab" aria-selected={format === "text"} aria-controls="ocr-content" size="sm" variant={format === "text" ? "default" : "outline"} onClick={() => setFormat("text")}>Text</Button>
          <Button role="tab" aria-selected={format === "markdown"} aria-controls="ocr-content" size="sm" variant={format === "markdown" ? "default" : "outline"} onClick={() => setFormat("markdown")}>Markdown</Button>
        </div>
        <pre id="ocr-content" role="tabpanel" aria-label={format === "text" ? "Text" : "Markdown"} className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-4 text-sm leading-6 [overflow-wrap:anywhere]">{content}</pre>
      </div> : <EmptyState icon={ScanLine} title="No extracted content" description="Choose a document to start an extraction." />}
    </section>
  </div></DashboardLayout>;
}
