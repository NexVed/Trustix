import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, FileWarning, Zap, XCircle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useVault } from "@/contexts/VaultContext";
import { useToast } from "@/hooks/use-toast";

interface RiskAlert {
  id?: string;
  created_at: string;
  action: string;
  entity: string;
  type: string;
}

function computeSeverity(entry: RiskAlert): "High" | "Medium" | "Low" {
  const action = entry.action.toLowerCase();
  if (entry.type === "Failed" || action.includes("login") || action.includes("suspicious")) return "High";
  if (entry.type === "Warning" || action.includes("anomaly") || action.includes("trigger")) return "Medium";
  return "Low";
}

function getAlertIcon(severity: string) {
  if (severity === "High") return ShieldAlert;
  if (severity === "Medium") return FileWarning;
  return Zap;
}

export default function RiskMonitoring() {
  const { session } = useAuth();
  const { vaultId, token: vaultToken } = useVault();
  const { toast } = useToast();

  const [allEvents, setAllEvents] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const authToken = session?.access_token || vaultToken;
        if (!authToken) return;

        const params = new URLSearchParams({ page_size: "50" });
        if (vaultId) params.set("vault_id", vaultId);

        const response = await fetch(`${API_URL}/activities?${params.toString()}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setAllEvents(data.activities || []);
        }
      } catch (err) {
        console.error("Failed to fetch risk events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [session?.access_token, vaultToken, vaultId]);

  // Filter for risk-worthy events (failed, warnings, or security-related)
  const riskEvents = allEvents.filter(
    (e) => e.type === "Failed" || e.type === "Warning" ||
      e.action.toLowerCase().includes("login") ||
      e.action.toLowerCase().includes("trigger") ||
      e.action.toLowerCase().includes("suspicious")
  ).filter((e) => !dismissedIds.has(e.id || e.created_at));

  // Compute risk score (0-100) from events
  const totalEvents = allEvents.length;
  const failedCount = allEvents.filter((e) => e.type === "Failed").length;
  const warningCount = allEvents.filter((e) => e.type === "Warning").length;
  const riskScore = totalEvents > 0
    ? Math.min(100, Math.round(((failedCount * 3 + warningCount) / Math.max(totalEvents, 1)) * 100))
    : 0;

  // Generate heatmap from last 28 days of events
  const heatmapData = Array.from({ length: 28 }, (_, dayIdx) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - dayIdx));
    const dateStr = date.toISOString().slice(0, 10);
    const dayEvents = allEvents.filter((e) => e.created_at?.slice(0, 10) === dateStr);
    const dayFailed = dayEvents.filter((e) => e.type === "Failed").length;
    const dayWarning = dayEvents.filter((e) => e.type === "Warning").length;
    if (dayFailed > 0) return 3;
    if (dayWarning > 0) return 2;
    if (dayEvents.length > 0) return 1;
    return 0;
  });
  const heatColors = ["bg-muted", "bg-success/30", "bg-warning/40", "bg-destructive/40"];

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    toast({ title: "Alert Dismissed", description: "The alert has been dismissed." });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Risk Monitoring</h1>
          <p className="page-subtitle">Threat detection & security event analytics</p>
        </div>

        {/* Risk Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-enterprise p-5">
            <p className="stat-label mb-1">Risk Score</p>
            <p className={`stat-value ${riskScore > 50 ? "text-destructive" : riskScore > 20 ? "text-warning" : "text-success"}`}>{riskScore}/100</p>
            <p className="text-xs text-muted-foreground mt-1">{riskScore > 50 ? "Elevated risk" : riskScore > 20 ? "Moderate" : "Low risk"}</p>
          </div>
          <div className="card-enterprise p-5">
            <p className="stat-label mb-1">Active Alerts</p>
            <p className="stat-value">{riskEvents.length}</p>
          </div>
          <div className="card-enterprise p-5">
            <p className="stat-label mb-1">Failed Events</p>
            <p className="stat-value text-destructive">{failedCount}</p>
          </div>
          <div className="card-enterprise p-5">
            <p className="stat-label mb-1">Total Events</p>
            <p className="stat-value">{totalEvents}</p>
          </div>
        </div>

        {/* Alert Cards */}
        <div className="space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="card-enterprise p-5"><Skeleton className="h-16 w-full" /></div>
            ))
          ) : riskEvents.length > 0 ? (
            riskEvents.map((a, i) => {
              const severity = computeSeverity(a);
              const Icon = getAlertIcon(severity);
              return (
                <div key={a.id || i} className="card-enterprise p-5 flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${severity === "High" ? "bg-destructive/10" : severity === "Medium" ? "bg-warning/10" : "bg-info/10"}`}>
                    <Icon className={`h-5 w-5 ${severity === "High" ? "text-destructive" : severity === "Medium" ? "text-warning" : "text-info"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">{a.action}</h4>
                      <span className={severity === "High" ? "badge-destructive" : severity === "Medium" ? "badge-warning" : "badge-encrypted"}>{severity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.entity}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => handleDismiss(a.id || a.created_at)}>
                      <XCircle className="h-3 w-3" />Dismiss
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card-enterprise p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-1">No Active Alerts</h3>
              <p className="text-xs text-muted-foreground">No security threats detected. All systems nominal.</p>
            </div>
          )}
        </div>

        {/* Risk Heatmap from real data */}
        <div className="card-enterprise p-5">
          <h3 className="section-title mb-1">Risk Heatmap</h3>
          <p className="text-xs text-muted-foreground mb-4">Past 4 weeks activity density</p>
          <div className="grid grid-cols-7 gap-1.5">
            {heatmapData.map((level, i) => (
              <div key={i} className={`aspect-square rounded-md ${heatColors[level]}`} title={`Risk level: ${level}`} />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-muted" />None</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-success/30" />Low</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-warning/40" />Medium</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-destructive/40" />High</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
