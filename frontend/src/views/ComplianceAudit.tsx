import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmptyState, PageHeader, PanelHeading } from "@/components/WorkspacePage";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useVault } from "@/contexts/VaultContext";

interface AuditEntry {
  created_at: string;
  action: string;
  entity: string;
  type: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ComplianceAudit() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { vaultId, token: vaultToken } = useVault();

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [gdprEnabled, setGdprEnabled] = useState(true);
  const [retentionPolicy, setRetentionPolicy] = useState("7years");

  // Fetch real audit logs from user_activities
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const authToken = session?.access_token || vaultToken;
        if (!authToken) return;

        const params = new URLSearchParams({ page_size: "15" });
        if (vaultId) params.set("vault_id", vaultId);

        const response = await fetch(`${API_URL}/activities?${params.toString()}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) throw new Error("Audit events could not be loaded.");
        if (response.ok) {
          const data = await response.json();
          setAuditLogs(data.activities || []);
        }
      } catch (err) {
        setError("Audit events could not be loaded.");
        console.error("Failed to fetch audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [session?.access_token, vaultToken, vaultId]);

  // Load settings (GDPR, retention)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const authToken = session?.access_token;
        if (!authToken) return;

        const response = await fetch(`${API_URL}/settings`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.gdpr_enabled !== undefined) setGdprEnabled(data.gdpr_enabled);
          if (data.retention_policy) setRetentionPolicy(data.retention_policy);
        }
      } catch (err) {
        console.error("Failed to load compliance settings:", err);
      }
    };
    fetchSettings();
  }, [session?.access_token]);

  const savePolicy = async (key: "gdpr_enabled" | "retention_policy", value: boolean | string) => {
    if (!session?.access_token) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });
      if (!response.ok) throw new Error("Could not save policy.");
      if (key === "gdpr_enabled" && typeof value === "boolean") setGdprEnabled(value);
      if (key === "retention_policy" && typeof value === "string") setRetentionPolicy(value);
      toast({ title: "Policy saved" });
    } catch { toast({ title: "Policy not saved", description: "Please try again.", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  // Compute compliance score from audit logs
  const totalLogs = auditLogs.length;
  const successLogs = auditLogs.filter((l) => l.type === "Success").length;
  const failedLogs = auditLogs.filter((l) => l.type === "Failed").length;
  const complianceScore = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="ws-page">
        <PageHeader section="Protection" title="Compliance & audit" description="Workspace policies and a record of your vault activity." />
        {error && <div className="ws-error" role="alert">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compliance Score — computed from real data */}
          <div className="card-enterprise p-6">
            <h3 className="section-title mb-1">Event success rate</h3>
            <p className="text-xs text-muted-foreground mb-6">Last {totalLogs} loaded events, not a compliance certification</p>
            <div className="flex flex-col items-center">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(220, 14%, 96%)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#19bb91" strokeWidth="10" strokeDasharray={`${(complianceScore / 100) * 314} 314`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-medium text-foreground">{totalLogs ? `${complianceScore}%` : "--"}</span>
                  <span className="text-[10px] text-muted-foreground">{totalLogs ? "Successful" : "No data"}</span>
                </div>
              </div>
              <div className="mt-4 badge-encrypted">
                {totalLogs ? "Activity summary" : "Awaiting activity"}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span>{successLogs} passed</span>
                <span>{failedLogs} failed</span>
              </div>
            </div>
          </div>

          {/* GDPR & Policies — persisted via settings */}
          <div className="card-enterprise p-6 lg:col-span-2">
            <h3 className="section-title mb-6">Policy Configuration</h3>
            <div className="space-y-6">
              <div className="ws-policy-row">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">GDPR Compliance Mode</p>
                    <p className="text-xs text-muted-foreground">Workspace data protection preference</p>
                  </div>
                </div>
                <Switch
                  aria-label="GDPR compliance mode"
                  disabled={!session || saving}
                  checked={gdprEnabled}
                  onCheckedChange={(v) => savePolicy("gdpr_enabled", v)}
                />
              </div>
              <div className="ws-policy-row">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Data Retention Policy</p>
                    <p className="text-xs text-muted-foreground">Automatic data lifecycle management</p>
                  </div>
                </div>
                <Select
                  disabled={!session || saving}
                  value={retentionPolicy}
                  onValueChange={(v) => savePolicy("retention_policy", v)}
                >
                  <SelectTrigger className="w-[160px]" aria-label="Data retention policy"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="3years">3 Years</SelectItem>
                    <SelectItem value="7years">7 Years</SelectItem>
                    <SelectItem value="indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log — real data */}
        <div className="card-enterprise overflow-hidden">
          <PanelHeading title="Audit ledger" description="Recent workspace activity" action={<span className="text-xs text-muted-foreground">{totalLogs} events</span>} />
          {!loading && !auditLogs.length ? <EmptyState icon={Lock} title={error ? "Audit history unavailable" : "No audit history yet"} description="Recorded vault events will appear here." /> : <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Action</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Entity</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Result</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{log.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.entity}</TableCell>
                    <TableCell>
                      <span className={log.type === "Success" ? "badge-success" : log.type === "Failed" ? "badge-destructive" : "badge-warning"}>
                        {log.type === "Success" && <CheckCircle2 className="h-3 w-3" />}
                        {log.type === "Failed" && <XCircle className="h-3 w-3" />}
                        {log.type === "Warning" && <AlertTriangle className="h-3 w-3" />}
                        {log.type}
                      </span>
                    </TableCell>
                    <TableCell><Lock className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                    No audit events recorded yet. Activities will appear here as you use the platform.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>}
        </div>
      </div>
    </DashboardLayout>
  );
}
