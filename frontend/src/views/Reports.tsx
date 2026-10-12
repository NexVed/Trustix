import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricStrip, PageHeader } from "@/components/WorkspacePage";
import { Button } from "@/components/ui/button";
import { Download, FileText, Users, Activity, ShieldCheck, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVault } from "@/contexts/VaultContext";
import { downloadCsv, downloadJson, downloadPdf } from "@/lib/workspace-export";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Summary { encrypted_assets: number; active_nominees: number; }
interface Event { created_at: string; action: string; entity: string; type: string; }
interface ReportData { summary: Summary; events: Event[]; total: number; updated: string; }

export default function Reports() {
  const { session } = useAuth();
  const { vaultId, token: vaultToken } = useVault();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [exporting, setExporting] = useState(false);
  const token = session?.access_token || vaultToken;
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    setData(null); setError("");
    if (!token) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    const summaryParams = new URLSearchParams();
    const eventParams = new URLSearchParams({ page_size: "100" });
    if (vaultId) { summaryParams.set("vault_id", vaultId); eventParams.set("vault_id", vaultId); }
    const read = async (url: string) => {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      if (!response.ok) throw new Error("Report data could not be loaded. Please try again.");
      return response.json();
    };
    Promise.all([read(`${api}/dashboard/summary?${summaryParams}`), read(`${api}/activities?${eventParams}`)])
      .then(([summary, events]) => { if (controller.signal.aborted) return; setData({
        summary: { encrypted_assets: summary.metrics?.encrypted_assets || 0, active_nominees: summary.metrics?.active_nominees || 0 },
        events: events.activities || [], total: events.total || 0, updated: new Date().toISOString(),
      }); })
      .catch(e => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, vaultId, api, revision]);

  const success = data?.events.filter(e => e.type === "Success").length || 0;
  const rate = data?.events.length ? Math.round(success / data.events.length * 100) : null;
  const count = (value: number | undefined) => loading ? "..." : value ?? "--";
  const reports = [
    { id: "assets", title: "Asset summary", icon: FileText, tone: "mint", description: "A snapshot of the encrypted asset count in your workspace.", detail: "Current inventory total", rows: [["Encrypted assets", data?.summary.encrypted_assets ?? 0]] },
    { id: "nominees", title: "Nominee summary", icon: Users, tone: "cyan", description: "An overview of the active nominees recorded in your workspace.", detail: "Current nominee total", rows: [["Active nominees", data?.summary.active_nominees ?? 0]] },
    { id: "activity", title: "Activity export", icon: Activity, tone: "mint", description: "Timestamps, actions and outcomes for up to 100 recent events.", detail: `${data?.events.length || 0} events available`, rows: [] },
    { id: "audit", title: "Audit summary", icon: ShieldCheck, tone: "cyan", description: "Successful and failed event counts. Not a compliance certification.", detail: "Based on loaded events", rows: [["Reviewed events", data?.events.length || 0], ["Successful events", success], ["Failed events", data?.events.filter(e => e.type === "Failed").length || 0]] },
  ];

  const reportRows = (report: typeof reports[number], snapshot: ReportData) => report.id === "activity"
      ? [["Timestamp", "Action", "Entity", "Result"], ...snapshot.events.map(e => [e.created_at, e.action, e.entity, e.type])]
      : [["Metric", "Value", "Snapshot time"], ...report.rows.map(row => [...row, snapshot.updated])];

  const exportReport = async (report: typeof reports[number], format: "csv" | "pdf") => {
    if (!data || exporting) return;
    setExporting(true); setError("");
    try {
      const rows = reportRows(report, data);
      const filename = `trustix-${report.id}-${data.updated.slice(0, 10)}.${format}`;
      if (format === "csv") downloadCsv(filename, rows);
      else await downloadPdf(filename, {
        title: report.title, generatedAt: data.updated,
        notice: `Workspace snapshot. Activity covers ${data.events.length} loaded events out of ${data.total} recorded events. This report is not a compliance certification.`,
        sections: [{ title: report.title, columns: rows[0].map(String), rows: rows.slice(1) }],
      });
    } catch { setError("The report could not be exported. Please retry."); }
    finally { setExporting(false); }
  };

  const exportAll = async (format: "csv" | "json" | "pdf") => {
    if (!data || exporting) return;
    setExporting(true); setError("");
    try {
      const filename = `trustix-workspace-report-${data.updated.slice(0, 10)}.${format}`;
      if (format === "json") downloadJson(filename, data);
      else if (format === "csv") downloadCsv(filename, [
        ["Section", "Timestamp", "Metric / action", "Value / entity", "Result"],
        ...reports.filter(report => report.id !== "activity").flatMap(report => report.rows.map(row => [report.title, data.updated, ...row, ""])),
        ...data.events.map(event => ["Activity", event.created_at, event.action, event.entity, event.type]),
      ]);
      else await downloadPdf(filename, {
        title: "Workspace report", generatedAt: data.updated,
        notice: `Activity covers ${data.events.length} loaded events out of ${data.total} recorded events. This report is not a compliance certification.`,
        sections: reports.map(report => { const rows = reportRows(report, data); return { title: report.title, columns: rows[0].map(String), rows: rows.slice(1) }; }),
      });
    } catch { setError("The report could not be exported. Please retry."); }
    finally { setExporting(false); }
  };

  return <DashboardLayout><div className="ws-page">
    <PageHeader title="Reports" description="Workspace snapshots and recent activity, ready to export." actions={<>
      <Button variant="outline" size="sm" onClick={() => setRevision(v => v + 1)} disabled={!token || loading || exporting}><RefreshCw size={14} />Refresh data</Button>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" disabled={!data || loading || exporting}>{exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}Export all</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => void exportAll("pdf")}>PDF report</DropdownMenuItem><DropdownMenuItem onSelect={() => void exportAll("csv")}>CSV spreadsheet</DropdownMenuItem><DropdownMenuItem onSelect={() => void exportAll("json")}>JSON data</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
    </>} />
    {!token && <div className="ws-notice"><ShieldCheck size={16} /><span>Connect an account or vault to load report data.</span></div>}
    {error && <div className="ws-error" role="alert">{error}</div>}
    <MetricStrip items={[
      { label: "Encrypted assets", value: count(data?.summary.encrypted_assets), detail: "Workspace inventory", icon: FileText },
      { label: "Active nominees", value: count(data?.summary.active_nominees), detail: "Trusted circle", icon: Users, tone: "cyan" },
      { label: "Recorded events", value: count(data?.total), detail: "Total available", icon: Activity, tone: "navy" },
      { label: "Event success rate", value: rate === null ? "--" : `${rate}%`, detail: "Up to 100 loaded events", icon: ShieldCheck },
    ]} />
    <div className="ws-toolbar"><span className="text-xs text-muted-foreground">{loading ? "Loading report data..." : data ? `Snapshot: ${new Date(data.updated).toLocaleString()}` : "No snapshot available"}</span></div>
    <div className="ws-report-grid">{reports.map(report => <article key={report.id} className="card-enterprise ws-report">
      <div className="ws-report-top"><span className={`tx-small-icon ${report.tone}`}><report.icon size={18} /></span><h3>{report.title}</h3></div>
      <p>{report.description}</p>
      <div className="ws-report-footer flex-wrap gap-3"><small>{report.detail}</small><div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={!data || loading || exporting} onClick={() => void exportReport(report, "pdf")}><FileText size={14} />Download PDF</Button>
        <Button variant="outline" size="sm" disabled={!data || loading || exporting} onClick={() => void exportReport(report, "csv")}><Download size={14} />Download CSV</Button>
      </div></div>
    </article>)}</div>
  </div></DashboardLayout>;
}
