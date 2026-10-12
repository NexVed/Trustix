"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCheck, ChevronRight, FileCheck2, FileText, Fingerprint, KeyRound, LineChart as LineIcon, LockKeyhole, Plus, ShieldCheck, Users, Wallet, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useVault } from "@/contexts/VaultContext";
import VaultCreationPopup from "@/components/trustix-vault/VaultCreationPopup";
import VaultAccess from "@/components/vault/VaultAccess";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { GenerateWallet } from "@/components/wallet/GenerateWallet";
import { SignMessage } from "@/components/wallet/SignMessage";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { downloadCsv, downloadJson, downloadPdf } from "@/lib/workspace-export";

interface Summary {
  metrics: { encrypted_assets: number; verified_documents: number; pending_triggers: number; fraud_alerts: number; notarizations: number; active_nominees: number };
  charts: { vault_growth: { month: string; assets: number }[]; asset_distribution: { name: string; value: number }[] };
  recent_activity: { action: string; entity: string; type: string; time: string }[];
}

const SAMPLE: Summary = {
  metrics: { encrypted_assets: 32, verified_documents: 24, pending_triggers: 0, fraud_alerts: 0, notarizations: 8, active_nominees: 3 },
  charts: {
    vault_growth: [{ month: "May", assets: 9 }, { month: "Jun", assets: 14 }, { month: "Jul", assets: 12 }, { month: "Aug", assets: 21 }, { month: "Sep", assets: 26 }, { month: "Oct", assets: 32 }],
    asset_distribution: [{ name: "Documents", value: 45 }, { name: "Digital wallets", value: 25 }, { name: "Financial accounts", value: 20 }, { name: "Other assets", value: 10 }],
  },
  recent_activity: [
    { action: "Document verified", entity: "Property deed.pdf", type: "verify", time: "Today, 10:42 AM" },
    { action: "Nominee added", entity: "Sarah Mitchell", type: "nominee", time: "Today, 9:18 AM" },
    { action: "Asset encrypted", entity: "Investment portfolio", type: "vault", time: "Yesterday, 4:30 PM" },
    { action: "Record notarized", entity: "Family trust.pdf", type: "blockchain", time: "Yesterday, 2:15 PM" },
    { action: "Document uploaded", entity: "Insurance policy.pdf", type: "vault", time: "Oct 08, 11:20 AM" },
  ],
};
const EMPTY: Summary = {
  metrics: { encrypted_assets: 0, verified_documents: 0, pending_triggers: 0, fraud_alerts: 0, notarizations: 0, active_nominees: 0 },
  charts: { vault_growth: [], asset_distribution: [] }, recent_activity: [],
};
const COLORS = ["#13c99b", "#61cce0", "#133b53", "#c6e9df"];

export default function Index() {
  const { user, session, loading: authLoading } = useAuth();
  const { vaultId, vaultCode, setVaultToken } = useVault();
  const preview = process.env.NODE_ENV === "development" && !session && !authLoading;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [range, setRange] = useState("6");
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");
  const [tipVisible, setTipVisible] = useState(true);
  const [dialog, setDialog] = useState<"create" | "access" | "wallet" | null>(null);

  useEffect(() => {
    if (!session?.access_token) { setSummary(null); return; }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (vaultId) params.set("vault_id", vaultId);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/dashboard/summary?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error("Unable to load your overview.");
      setSummary(await response.json());
    }).catch(err => { if (err.name !== "AbortError") setError("Your overview is temporarily unavailable."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session?.access_token, vaultId, refresh]);

  const data = preview ? SAMPLE : summary || EMPTY;
  const m = data.metrics;
  const chart = data.charts.vault_growth.slice(-Number(range));
  const verification = m.encrypted_assets ? Math.min(100, Math.round(m.verified_documents / m.encrypted_assets * 100)) : 0;
  const tasks = [
    { title: "Create your vault", text: "A home for your digital legacy", complete: preview || !!vaultId, action: () => setDialog("create"), href: "" },
    { title: "Add your first asset", text: "Keep important records together", complete: m.encrypted_assets > 0, href: "/asset-vault" },
    { title: "Choose trusted nominees", text: "Decide who carries it forward", complete: m.active_nominees > 0, href: "/nominee-governance" },
    { title: "Review access permissions", text: "Give the right people access", complete: false, href: "/access-control" },
  ];
  const completed = tasks.filter(task => task.complete).length;
  const activityIcons = { verify: FileCheck2, nominee: Users, vault: LockKeyhole, blockchain: Fingerprint };
  const exportOverview = async (format: "pdf" | "csv" | "json") => {
    if (exporting || loading || (!preview && !summary)) return;
    setExporting(true); setExportError("");
    const snapshot = new Date().toISOString();
    const metrics = Object.entries(m).map(([key, value]) => [key.replace(/_/g, " "), value]);
    try {
      const filename = `trustix-${preview ? "sample-" : ""}overview-${snapshot.slice(0, 10)}.${format}`;
      if (format === "json") downloadJson(filename, { sample: preview, exported_at: snapshot, ...data, charts: { ...data.charts, vault_growth: chart } });
      else if (format === "csv") downloadCsv(filename, [
        ["Source", "Section", "Metric / time", "Value / action", "Entity", "Type"],
        ...metrics.map(row => [preview ? "Sample data" : "Workspace", "Metrics", ...row, "", ""]),
        ...chart.map(row => [preview ? "Sample data" : "Workspace", "Vault growth", row.month, row.assets, "", ""]),
        ...data.charts.asset_distribution.map(row => [preview ? "Sample data" : "Workspace", "Asset distribution", row.name, row.value, "", ""]),
        ...data.recent_activity.map(row => [preview ? "Sample data" : "Workspace", "Activity", row.time, row.action, row.entity, row.type]),
      ]);
      else await downloadPdf(filename, {
        title: preview ? "Sample workspace overview" : "Workspace overview", generatedAt: snapshot,
        notice: preview ? "PREVIEW ONLY. This report contains illustrative sample data, not your real vault records." : "Snapshot of loaded workspace data. This report contains summary information, not vault recovery credentials.",
        sections: [
          { title: "Workspace metrics", columns: ["Metric", "Value"], rows: metrics },
          { title: `Vault growth / ${range} months`, columns: ["Month", "Assets"], rows: chart.map(row => [row.month, row.assets]) },
          { title: "Asset distribution", columns: ["Category", "Value"], rows: data.charts.asset_distribution.map(row => [row.name, row.value]) },
          { title: "Recent activity", columns: ["Time", "Action", "Entity", "Type"], rows: data.recent_activity.map(row => [row.time, row.action, row.entity, row.type]) },
        ],
      });
    } catch { setExportError("The overview could not be exported. Please retry."); }
    finally { setExporting(false); }
  };

  return <DashboardLayout>
    <div className="tx-overview">
      <div className="tx-page-heading">
        <div><div className="tx-eyebrow">YOUR DIGITAL LEGACY</div><h1>Overview<span className="tx-heading-dot">.</span></h1><p>Everything that matters, all in one place.</p></div>
        <div className="tx-heading-actions">{preview && <span className="tx-sample-label">Preview · Sample data</span>}
          <DropdownMenu><DropdownMenuTrigger asChild><button className="tx-button" disabled={loading || authLoading || !!error || exporting || (!preview && !summary)}><ArrowDownToLine size={15} />{exporting ? "Exporting..." : "Export"}</button></DropdownMenuTrigger><DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => void exportOverview("pdf")}>PDF report</DropdownMenuItem><DropdownMenuItem onSelect={() => void exportOverview("csv")}>CSV spreadsheet</DropdownMenuItem><DropdownMenuItem onSelect={() => void exportOverview("json")}>JSON data</DropdownMenuItem>
          </DropdownMenuContent></DropdownMenu><button className="tx-button tx-button-dark" onClick={() => setDialog("create")}><Plus size={16} />Create vault</button></div>
      </div>
      {error && <div className="tx-error" role="alert">{error}<button onClick={() => setRefresh(value => value + 1)}>Retry</button></div>}
      {exportError && <div className="tx-error" role="alert">{exportError}</div>}
      {loading && <div className="tx-loading" role="status">Updating your overview...</div>}
      <div className="tx-dashboard-grid">
        <div className="tx-primary-column">
          <section className="tx-panel tx-balance" aria-label="Vault overview">
            <div className="tx-chart-section">
              <div className="tx-panel-heading"><div><span className="tx-label">Total protected assets</span><div className="tx-big-number">{m.encrypted_assets}<span>assets</span></div><p className="tx-muted">Your vault at a glance</p></div>
                <div className="tx-chart-controls"><select aria-label="Chart time range" value={range} onChange={e => setRange(e.target.value)}><option value="6">6 months</option><option value="3">3 months</option></select><div className="tx-segments"><button title="Bar chart" aria-label="Bar chart" aria-pressed={chartMode === "bar"} onClick={() => setChartMode("bar")}><BarChart3 size={15} /></button><button title="Line chart" aria-label="Line chart" aria-pressed={chartMode === "line"} onClick={() => setChartMode("line")}><LineIcon size={15} /></button></div></div>
              </div>
              <div className="tx-chart-legend"><span><i style={{ background: "#13c99b" }} />Protected assets</span><span className="tx-muted">{preview ? "Sample history" : "Vault history"}</span></div>
              <div className="tx-growth-chart">
                {chart.length ? <ResponsiveContainer width="100%" height="100%">
                  {chartMode === "bar" ? <BarChart data={chart} margin={{ top: 12, right: 4, left: -24, bottom: 0 }} barSize={44}>
                    <CartesianGrid vertical={false} stroke="#edf0ef" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#84918f", fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#84918f", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "#f2f8f5" }} contentStyle={{ border: "1px solid #e8eeeb", borderRadius: 8, fontSize: 12 }} />
                    <Bar name="Assets" dataKey="assets" radius={[4, 4, 0, 0]}>{chart.map((entry, index) => <Cell key={entry.month} fill={index === chart.length - 1 ? "#13c99b" : index === chart.length - 2 ? "#a1ebd6" : "#edf2f0"} />)}</Bar>
                  </BarChart> : <LineChart data={chart} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#edf0ef" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#84918f", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#84918f", fontSize: 10 }} allowDecimals={false} /><Tooltip /><Line name="Assets" type="monotone" dataKey="assets" stroke="#13b68b" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>}
                </ResponsiveContainer> : <div className="tx-empty"><BarChart3 size={28} /><p>Your asset history will appear here.</p><Link href="/asset-vault">Add your first asset <ArrowRight size={14} /></Link></div>}
              </div>
            </div>
            <div className="tx-summary-stats">
              {[{ label: "Verified documents", value: m.verified_documents, text: "Organized & reviewed", icon: FileCheck2, tone: "mint" }, { label: "Trusted nominees", value: m.active_nominees, text: "People you can count on", icon: Users, tone: "cyan" }, { label: "Notarized records", value: m.notarizations, text: "Recorded for the future", icon: Fingerprint, tone: "navy" }].map(item => <div className="tx-stat" key={item.label}><span className={`tx-small-icon ${item.tone}`}><item.icon size={16} /></span><span className="tx-label">{item.label}</span><strong>{item.value.toString().padStart(2, "0")}</strong><small>{item.text}</small></div>)}
            </div>
          </section>

          <div className="tx-middle-row">
            <section className="tx-panel tx-verification"><div className="tx-panel-heading"><div><h2>Document readiness</h2><p className="tx-muted">Verified assets in your vault</p></div><Link href="/ai-verification" className="tx-icon-button" title="Review documents"><ArrowUpRight size={16} /></Link></div><div className="tx-progress-track"><span style={{ width: verification + "%" }} /></div><div className="tx-between"><strong>{m.verified_documents} verified</strong><span>{m.encrypted_assets} total assets</span></div></section>
            {tipVisible ? <section className="tx-panel tx-tip"><div><span className="tx-eyebrow">A LITTLE PEACE OF MIND</span><h2>Plan today. Protect tomorrow.</h2><p>Give someone you trust a way to be there.</p><Link href="/nominee-governance">Review your nominees <ArrowRight size={14} /></Link></div><ShieldCheck className="tx-tip-shield" size={75} strokeWidth={1} /><button className="tx-tip-close" aria-label="Dismiss planning tip" title="Dismiss tip" onClick={() => setTipVisible(false)}><X size={14} /></button></section> : <section className="tx-panel tx-tip"><div><h2>Your next step</h2><p>Keep your vault permissions up to date.</p><Link href="/access-control">Manage access <ArrowRight size={14} /></Link></div><KeyRound size={40} color="#13b68b" /></section>}
          </div>

          <div className="tx-bottom-row">
            <section className="tx-panel tx-allocation"><div className="tx-panel-heading"><div><h2>Asset allocation</h2><p className="tx-muted">A place for everything</p></div><Link href="/asset-vault" title="View all assets"><ArrowUpRight size={16} /></Link></div><div className="tx-section-number">{m.encrypted_assets}<small>total assets</small></div>
              <div className="tx-allocation-bar">{data.charts.asset_distribution.map((item, i) => <span key={item.name} style={{ flex: item.value, background: COLORS[i % COLORS.length] }} title={item.name} />)}</div>
              <div className="tx-allocation-list">{data.charts.asset_distribution.length ? data.charts.asset_distribution.map((item, i) => <div key={item.name}><span><i style={{ background: COLORS[i % COLORS.length] }} />{item.name}</span><strong>{item.value}%</strong></div>) : <p className="tx-muted">No assets added yet.</p>}</div>
              <Link className="tx-bottom-link" href="/asset-vault">View all assets <ChevronRight size={14} /></Link>
            </section>
            <section className="tx-panel tx-readiness"><div><h2>Legacy readiness</h2><p className="tx-muted">The little steps that matter</p></div>
              <div className="tx-gauge"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ value: completed }, { value: 4 - completed }]} dataKey="value" cx="50%" cy="80%" innerRadius="82%" outerRadius="100%" startAngle={180} endAngle={0} stroke="none" isAnimationActive={false}><Cell fill="#13c99b" /><Cell fill="#eef3f1" /></Pie></PieChart></ResponsiveContainer><div><strong>{completed * 25}%</strong><small>of your setup complete</small></div></div>
              <div className="tx-readiness-caption"><span><CheckCheck size={15} />{completed} of 4 steps complete</span><p>A few thoughtful steps make a lasting difference.</p></div>
            </section>
            <section className="tx-panel tx-checklist"><div className="tx-panel-heading"><div><h2>Your next steps</h2><p className="tx-muted">Build a stronger legacy</p></div><span className="tx-count">{completed}/4</span></div>
              {tasks.map(task => { const content = <><span className={`tx-task-check ${task.complete ? "complete" : ""}`}>{task.complete ? <Check size={13} /> : <Plus size={13} />}</span><span><strong>{task.title}</strong><small>{task.text}</small></span><ChevronRight size={13} /></>; return task.href ? <Link className="tx-task" key={task.title} href={task.href}>{content}</Link> : <button className="tx-task" key={task.title} onClick={task.action}>{content}</button>; })}
            </section>
          </div>
          <footer className="tx-overview-footer"><span><LockKeyhole size={13} /> Your legacy. Your control.</span><span>Made for what matters.</span></footer>
        </div>

        <aside className="tx-secondary-column">
          <section className="tx-panel tx-vault-panel"><div className="tx-panel-heading"><div><h2>My vault</h2><p className="tx-muted">Your digital safe place</p></div><button title="Open a vault" aria-label="Open a vault" onClick={() => setDialog("access")} className="tx-icon-button"><KeyRound size={16} /></button></div>
            <div className="tx-vault-pass"><div className="tx-between"><span>PERSONAL VAULT</span><img src="/trustixlogo.png" alt="Trustix" width="28" height="30" /></div><ShieldCheck size={32} strokeWidth={1.4} /><div><strong>{vaultCode || (preview ? "TX · DEMO VAULT" : "Your legacy starts here")}</strong><div className="tx-between"><span>{user?.user_metadata?.full_name || (preview ? "Sample personal vault" : "Create or open your vault")}</span><LockKeyhole size={12} /></div></div></div>
            <div className="tx-quick-actions"><Link href="/asset-vault"><span><Plus size={17} /></span>Add asset</Link><Link href="/nominee-governance"><span><Users size={17} /></span>Nominees</Link><button onClick={() => setDialog("wallet")}><span><Wallet size={17} /></span>Wallets</button><button onClick={() => setDialog("access")}><span><KeyRound size={17} /></span>Unlock</button></div>
            <div className="tx-nominee-heading"><h3>Trusted circle</h3><Link href="/nominee-governance" title="Manage trusted circle"><ArrowUpRight size={15} /></Link></div>
            {preview ? <div className="tx-people">{[{ name: "Sarah", initials: "SM", color: "#e1f5ed" }, { name: "James", initials: "JW", color: "#e3f2f8" }, { name: "Alex", initials: "AC", color: "#f4ebdd" }].map(person => <Link href="/nominee-governance" key={person.name}><span style={{ background: person.color }}>{person.initials}</span><small>{person.name}</small></Link>)}<Link href="/nominee-governance"><span className="tx-add-person"><Plus size={18} /></span><small>Add new</small></Link></div> : <Link className="tx-bottom-link" href="/nominee-governance">{m.active_nominees ? `${m.active_nominees} trusted nominees` : "Invite someone you trust"}<Plus size={15} /></Link>}
          </section>
          <section className="tx-panel tx-activity"><div className="tx-panel-heading"><div><h2>Recent activity</h2><p className="tx-muted">The latest in your workspace</p></div><Link href="/activity-ledger" title="View activity ledger"><ArrowUpRight size={16} /></Link></div>
            {data.recent_activity.length ? data.recent_activity.slice(0, 5).map((item, index) => { const Icon = activityIcons[item.type as keyof typeof activityIcons] || FileText; return <div className="tx-activity-row" key={index}><span className={`tx-activity-icon tone-${index % 3}`}><Icon size={16} /></span><div><strong>{item.action}</strong><span>{item.entity}</span><small>{preview ? item.time : new Date(item.time).toLocaleDateString()}</small></div><Check size={13} className="tx-activity-check" /></div>; }) : <div className="tx-empty"><FileText size={25} /><p>Your vault activity will appear here.</p></div>}
            <Link className="tx-bottom-link" href="/activity-ledger">All activity <ArrowRight size={14} /></Link>
          </section>
          <Link href="/risk-monitoring" className="tx-monitoring"><span className="tx-small-icon mint"><ShieldCheck size={17} /></span><span><strong>Risk monitoring</strong><small>{m.fraud_alerts ? `${m.fraud_alerts} alerts to review` : preview ? "No alerts in this preview" : "Review your protection status"}</small></span><ChevronRight size={15} /></Link>
        </aside>
      </div>
    </div>
    <VaultCreationPopup isOpen={dialog === "create"} onClose={() => setDialog(null)} />
    <Dialog open={dialog === "access" || dialog === "wallet"} onOpenChange={open => { if (!open) setDialog(null); }}>
      <DialogContent className="tx-action-dialog"><DialogTitle>{dialog === "wallet" ? "Your wallets" : "Open your vault"}</DialogTitle><DialogDescription>{dialog === "wallet" ? "Connect, create, or verify a wallet." : "Enter your vault identifier and secret key."}</DialogDescription>
        {dialog === "wallet" ? <div className="space-y-4"><ConnectWallet /><GenerateWallet /><SignMessage /></div> : <VaultAccess onUnlocked={() => { const token = localStorage.getItem("trustix.vault.token"); if (token) setVaultToken(token); setDialog(null); }} />}
      </DialogContent>
    </Dialog>
  </DashboardLayout>;
}
