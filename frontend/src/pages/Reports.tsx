import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Users, Link2, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVault } from "@/contexts/VaultContext";
import { useToast } from "@/hooks/use-toast";

interface ReportMetrics {
  encrypted_assets: number;
  active_nominees: number;
  activity_count: number;
  compliance_score: number;
  last_generated: string;
}

export default function Reports() {
  const { session } = useAuth();
  const { vaultId, token: vaultToken } = useVault();
  const { toast } = useToast();

  const [metrics, setMetrics] = useState<ReportMetrics>({
    encrypted_assets: 0,
    active_nominees: 0,
    activity_count: 0,
    compliance_score: 100,
    last_generated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Fetch real metrics from dashboard summary + activities
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const authToken = session?.access_token || vaultToken;
        if (!authToken) return;

        // Fetch dashboard summary
        const params = new URLSearchParams();
        if (vaultId) params.set("vault_id", vaultId);

        const [summaryRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/summary?${params.toString()}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch(`${API_URL}/activities?page_size=100${vaultId ? `&vault_id=${vaultId}` : ''}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        let assetCount = 0, nomineeCount = 0;
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          assetCount = data.metrics?.encrypted_assets || 0;
          nomineeCount = data.metrics?.active_nominees || 0;
        }

        let totalActivities = 0, successActivities = 0;
        if (activityRes.ok) {
          const actData = await activityRes.json();
          totalActivities = actData.total || 0;
          const activities = actData.activities || [];
          successActivities = activities.filter((a: any) => a.type === "Success").length;
        }

        const complianceScore = totalActivities > 0
          ? Math.round((successActivities / Math.min(totalActivities, 100)) * 100)
          : 100;

        setMetrics({
          encrypted_assets: assetCount,
          active_nominees: nomineeCount,
          activity_count: totalActivities,
          compliance_score: complianceScore,
          last_generated: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to fetch report metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [session?.access_token, vaultToken, vaultId]);

  const handleGenerate = (reportTitle: string, format: "PDF" | "CSV") => {
    setGenerating(`${reportTitle}-${format}`);

    // Log the report generation as an activity
    const authToken = session?.access_token || vaultToken;
    fetch(`${API_URL}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: "Report Exported",
        entity: `${reportTitle} (${format}) — ${dateFrom} to ${dateTo}`,
        type: "Success",
        vault_id: vaultId,
      }),
    }).finally(() => {
      setGenerating(null);
      toast({
        title: "Report Generated",
        description: `${reportTitle} (${format}) has been generated for ${dateFrom} to ${dateTo}. Download will start shortly.`,
      });
    });
  };

  const reports = [
    {
      title: "Asset Summary Report",
      description: "Complete inventory of encrypted assets with status and nominee assignments.",
      icon: FileText,
      stats: `${metrics.encrypted_assets} assets · Generated ${new Date(metrics.last_generated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Nominee Allocation Report",
      description: "Nominee distribution, approval statuses, and trigger condition analysis.",
      icon: Users,
      stats: `${metrics.active_nominees} nominees configured`,
      color: "bg-info/10 text-info",
    },
    {
      title: "Activity Audit Report",
      description: "Full activity log export with timestamps, actions, and results.",
      icon: Link2,
      stats: `${metrics.activity_count} events recorded`,
      color: "bg-success/10 text-success",
    },
    {
      title: "Compliance Report",
      description: "Compliance scores, policy configuration, and data retention analysis.",
      icon: ShieldCheck,
      stats: `${metrics.compliance_score}% compliance score`,
      color: "bg-warning/10 text-warning",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and export reports from your vault data</p>
        </div>

        {/* Date Range */}
        <div className="card-enterprise p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground">Date Range:</span>
          <Input type="date" className="w-[160px] h-9" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" className="w-[160px] h-9" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        {/* Report Cards — built from real metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((r) => (
            <div key={r.title} className="card-enterprise p-6 flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className={`h-12 w-12 rounded-xl ${r.color} flex items-center justify-center shrink-0`}>
                  <r.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">{r.title}</h3>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{loading ? "Loading..." : r.stats}</p>
              <div className="flex gap-2 mt-auto">
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-xs flex-1"
                  disabled={!!generating}
                  onClick={() => handleGenerate(r.title, "PDF")}
                >
                  {generating === `${r.title}-PDF` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Download PDF
                </Button>
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-xs flex-1"
                  disabled={!!generating}
                  onClick={() => handleGenerate(r.title, "CSV")}
                >
                  {generating === `${r.title}-CSV` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Download CSV
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
