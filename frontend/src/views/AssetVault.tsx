import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmptyState, MetricStrip, PageHeader, PanelHeading, VaultNotice } from "@/components/WorkspacePage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Shield, Upload, FileText, Loader2, FolderOpen, CalendarDays, RefreshCw } from "lucide-react";
import { useVault } from "@/contexts/VaultContext";
import { useToast } from "@/hooks/use-toast";
import { downloadBlob } from "@/lib/workspace-export";

interface VaultDocument { id: string; file_name: string; category: string; uploaded_by: string; created_at: string; }
const categories = { wills: "Wills", legal_contracts: "Legal contracts", property_documents: "Property documents", other: "Other" };

export default function AssetVault() {
  const { vaultId, role, token } = useVault();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    setDocuments([]);
    setError("");
    if (!vaultId || !token) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(`${api}/documents`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Documents could not be loaded. Check your vault session and try again.");
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : []);
      }).catch(e => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [vaultId, token, api, revision]);

  const upload = async (file: File) => {
    if (!token || uploading) return;
    setUploading(true);
    try {
      const body = new FormData(); body.append("file", file); body.append("category", category === "all" ? "other" : category);
      const response = await fetch(`${api}/documents/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || "Upload failed.");
      setRevision(v => v + 1);
      toast({ title: "Document uploaded", description: file.name });
    } catch (e) { toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" }); }
    finally { setUploading(false); }
  };

  const download = async (doc: VaultDocument) => {
    if (!token) return;
    setDownloading(doc.id);
    try {
      const response = await fetch(`${api}/documents/${doc.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("The document could not be downloaded.");
      downloadBlob(doc.file_name, await response.blob());
    } catch (e) { toast({ title: "Download failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" }); }
    finally { setDownloading(null); }
  };

  const filtered = documents.filter(doc => (category === "all" || doc.category === category) && doc.file_name.toLowerCase().includes(query.toLowerCase()));
  const count = (value: number) => loading ? "..." : error ? "--" : value;
  return <DashboardLayout><div className="ws-page">
    <PageHeader title="Asset vault" description="Your important documents, together in one place." actions={<>
      <Button variant="outline" size="sm" disabled={!token || loading} onClick={() => setRevision(v => v + 1)}><RefreshCw size={14} />Refresh</Button>
      <Button size="sm" disabled={!token || role !== "owner" || uploading} onClick={() => input.current?.click()}>{uploading ? <Loader2 className="animate-spin" /> : <Upload />}Upload document</Button>
      <input ref={input} type="file" accept="application/pdf" hidden onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ""; }} />
    </>} />
    {!vaultId && <VaultNotice />}
    <MetricStrip items={[
      { label: "Documents", value: count(documents.length), detail: "Stored in this vault", icon: FileText },
      { label: "Categories", value: count(new Set(documents.map(d => d.category)).size), detail: "Across your documents", icon: FolderOpen, tone: "cyan" },
      { label: "Added this month", value: count(documents.filter(d => new Date(d.created_at).getMonth() === new Date().getMonth() && new Date(d.created_at).getFullYear() === new Date().getFullYear()).length), detail: "Current calendar month", icon: CalendarDays, tone: "navy" },
      { label: "Vault access", value: vaultId ? role === "owner" ? "Owner" : "Nominee" : "Locked", detail: vaultId ? "Current session" : "No active vault session", icon: Shield },
    ]} />
    <div className="ws-toolbar">
      <label className="ws-search"><Search size={16} /><input aria-label="Search documents" placeholder="Search documents..." value={query} onChange={e => setQuery(e.target.value)} /></label>
      <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-[180px] h-9" aria-label="Document category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{Object.entries(categories).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
    </div>
    {error && <div className="ws-error" role="alert">{error}</div>}
    <section className="card-enterprise overflow-hidden">
      <PanelHeading title="Document library" description={`${filtered.length} documents${category !== "all" ? " in this category" : ""}`} />
      {loading ? <EmptyState icon={Loader2} title="Loading documents" description="Retrieving your vault library." /> : !filtered.length ? <EmptyState icon={FolderOpen} title={query || category !== "all" ? "No matching documents" : "Your library starts here"} description={vaultId ? "No documents are available in this view." : "Connect a vault to view your documents."} /> : <Table>
        <TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Category</TableHead><TableHead>Uploaded by</TableHead><TableHead>Added</TableHead><TableHead><span className="sr-only">Download</span></TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map(doc => <TableRow key={doc.id}><TableCell><span className="flex items-center gap-3"><span className="tx-small-icon mint"><FileText size={16} /></span>{doc.file_name}</span></TableCell><TableCell><span className="badge-encrypted">{categories[doc.category as keyof typeof categories] || doc.category}</span></TableCell><TableCell>{doc.uploaded_by}</TableCell><TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell><TableCell><Button variant="ghost" size="icon" aria-label={`Download ${doc.file_name}`} title="Download document" disabled={!!downloading} onClick={() => void download(doc)}>{downloading === doc.id ? <Loader2 className="animate-spin" /> : <Download />}</Button></TableCell></TableRow>)}</TableBody>
      </Table>}
    </section>
  </div></DashboardLayout>;
}
