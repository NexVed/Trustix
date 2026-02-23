import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, FileWarning, Zap, XCircle, ArrowUpRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fraudTrend = [
  { day: "Feb 15", score: 22 }, { day: "Feb 16", score: 18 }, { day: "Feb 17", score: 31 },
  { day: "Feb 18", score: 25 }, { day: "Feb 19", score: 42 }, { day: "Feb 20", score: 38 },
  { day: "Feb 21", score: 29 }, { day: "Feb 22", score: 15 },
];

const alerts = [
  { title: "Suspicious Login — Lagos, NG", severity: "High", description: "Multiple failed login attempts from unrecognized IP 154.72.150.33", time: "2 hours ago", icon: ShieldAlert },
  { title: "Document Metadata Anomaly", severity: "Medium", description: "Estate Planning Agreement shows modified creation date in EXIF data", time: "5 hours ago", icon: FileWarning },
  { title: "Trigger Activation Warning", severity: "Low", description: "Dead-man switch approaching 30-day first reminder threshold", time: "1 day ago", icon: Zap },
];

const heatmapData = Array.from({ length: 28 }, (_, i) => {
  const rand = Math.random();
  return rand < 0.6 ? 0 : rand < 0.8 ? 1 : rand < 0.95 ? 2 : 3;
});
const heatColors = ["bg-muted", "bg-success/30", "bg-warning/40", "bg-destructive/40"];

export default function RiskMonitoring() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Risk Monitoring</h1>
          <p className="page-subtitle">AI-powered threat detection & fraud analytics</p>
        </div>

        {/* Alert Cards */}
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <div key={i} className="card-enterprise p-5 flex items-start gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${a.severity === "High" ? "bg-destructive/10" : a.severity === "Medium" ? "bg-warning/10" : "bg-info/10"}`}>
                <a.icon className={`h-5 w-5 ${a.severity === "High" ? "text-destructive" : a.severity === "Medium" ? "text-warning" : "text-info"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
                  <span className={a.severity === "High" ? "badge-destructive" : a.severity === "Medium" ? "badge-warning" : "badge-encrypted"}>{a.severity}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.description}</p>
                <span className="text-[10px] text-muted-foreground">{a.time}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="outline" size="sm" className="text-xs gap-1"><ArrowUpRight className="h-3 w-3" />Escalate</Button>
                <Button variant="ghost" size="sm" className="text-xs gap-1"><XCircle className="h-3 w-3" />Dismiss</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fraud Trend */}
          <div className="card-enterprise p-5 lg:col-span-2">
            <h3 className="section-title mb-1">AI Fraud Trend</h3>
            <p className="text-xs text-muted-foreground mb-4">Risk score over the past 7 days</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={fraudTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "12px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="score" stroke="hsl(0, 72%, 51%)" strokeWidth={2.5} dot={{ fill: "hsl(0, 72%, 51%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Heatmap */}
          <div className="card-enterprise p-5">
            <h3 className="section-title mb-1">Risk Heatmap</h3>
            <p className="text-xs text-muted-foreground mb-4">Past 4 weeks (Mon–Sun)</p>
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
      </div>
    </DashboardLayout>
  );
}
