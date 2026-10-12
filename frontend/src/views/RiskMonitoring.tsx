import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmptyState, MetricStrip, PageHeader, PanelHeading } from "@/components/WorkspacePage";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, FileWarning, Zap, XCircle } from "lucide-react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RiskMonitoring() {
  const { session } = useAuth();
  const { vaultId, token: vaultToken } = useVault();
  const { toast } = useToast();

  const [allEvents, setAllEvents] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => { setToday(new Date().toISOString().slice(0, 10)); }, []);

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

        if (!response.ok) throw new Error("Risk events could not be loaded.");
        if (response.ok) {
          const data = await response.json();
          setAllEvents(data.activities || []);
        }
      } catch (err) {
        setError("Risk events could not be loaded. No security assessment is available.");
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
    const dateStr = today
      ? new Date(Date.parse(`${today}T00:00:00Z`) - (27 - dayIdx) * 86400000).toISOString().slice(0, 10)
      : null;
    const dayEvents = allEvents.filter((e) => e.created_at?.slice(0, 10) === dateStr);
    const dayFailed = dayEvents.filter((e) => e.type === "Failed").length;
    const dayWarning = dayEvents.filter((e) => e.type === "Warning").length;
    const level = dayFailed > 0 ? 3 : dayWarning > 0 ? 2 : dayEvents.length > 0 ? 1 : 0;
    return { date: dateStr, level };
  });
  const heatColors = ["bg-muted", "bg-success/30", "bg-warning/40", "bg-destructive/40"];

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    toast({ title: "Alert Dismissed", description: "The alert has been dismissed." });
  };

  return (
    <DashboardLayout>
      <div className="ws-page">
        <PageHeader section="Protection" title="Risk monitoring" description="Security events and signals that need your attention." />
        {error && <div className="ws-error" role="alert">{error}</div>}

        {/* Risk Score Summary */}
        <MetricStrip items={[
          { label: "Event risk indicator", value: totalEvents ? `${riskScore}/100` : "--", detail: totalEvents ? "Derived from recent events" : "Not enough data", icon: ShieldAlert },
          { label: "Active alerts", value: error ? "--" : riskEvents.length, detail: "In the latest 50 events", icon: AlertTriangle, tone: "amber" },
          { label: "Failed events", value: error ? "--" : failedCount, detail: "In the latest 50 events", icon: XCircle, tone: "cyan" },
          { label: "Events reviewed", value: error ? "--" : totalEvents, detail: "Up to 50 recent events", icon: Zap, tone: "navy" },
        ]} />
        <div className="ws-two-column">

        {/* Alert Cards */}
        <div className="card-enterprise overflow-hidden">
          <PanelHeading title="Security alerts" description="Failed actions, warnings and security signals" />
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-5"><Skeleton className="h-16 w-full" /></div>
            ))
          ) : riskEvents.length > 0 ? (
            riskEvents.map((a, i) => {
              const severity = computeSeverity(a);
              const Icon = getAlertIcon(severity);
              return (
                <div key={a.id || i} className="ws-alert">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${severity === "High" ? "bg-destructive/10" : severity === "Medium" ? "bg-warning/10" : "bg-info/10"}`}>
                    <Icon className={`h-5 w-5 ${severity === "High" ? "text-destructive" : severity === "Medium" ? "text-warning" : "text-info"}`} />
                  </div>
                  <div className="ws-alert-copy">
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
            <EmptyState icon={ShieldAlert} title={error ? "Monitoring unavailable" : "No alerts to display"} description={totalEvents ? "No undismissed alerts in the loaded events." : "No event data is available for a security assessment."} />
          )}
        </div>

        {/* Risk Heatmap from real data */}
        <div className="card-enterprise p-5">
          <h3 className="section-title mb-1">Event activity</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 28 days, from loaded events</p>
          <div className="ws-heatmap">
            {heatmapData.map(({ date, level }, i) => (
              <div key={i} className={heatColors[level]} title={`${date || `Day ${i + 1}`}: ${["No loaded events", "Activity", "Warning", "Failed event"][level]}`} />
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
      </div>
    </DashboardLayout>
  );
}
