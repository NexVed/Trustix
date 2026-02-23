import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import {
  Vault,
  FileCheck,
  Clock,
  AlertTriangle,
  Link2,
  Users,
  TrendingUp,
  Shield,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const vaultGrowthData = [
  { month: "Jul", assets: 142 },
  { month: "Aug", assets: 189 },
  { month: "Sep", assets: 234 },
  { month: "Oct", assets: 278 },
  { month: "Nov", assets: 321 },
  { month: "Dec", assets: 356 },
  { month: "Jan", assets: 412 },
  { month: "Feb", assets: 467 },
];

const assetDistribution = [
  { name: "Financial Accounts", value: 35 },
  { name: "Real Estate", value: 22 },
  { name: "Digital Assets", value: 18 },
  { name: "Legal Documents", value: 15 },
  { name: "Insurance Policies", value: 10 },
];

const COLORS = [
  "hsl(226, 82%, 48%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(280, 65%, 60%)",
];

const recentActivity = [
  { action: "Asset encrypted & stored", entity: "Goldman Sachs Trust Account", time: "2 min ago", type: "vault" },
  { action: "Document verified by AI", entity: "Estate Planning Agreement v3", time: "8 min ago", type: "verify" },
  { action: "Nominee approved", entity: "Sarah Reynolds — Secondary Nominee", time: "24 min ago", type: "nominee" },
  { action: "Blockchain notarization complete", entity: "TX 0x8f3a...d12e", time: "1 hr ago", type: "blockchain" },
  { action: "Fraud alert resolved", entity: "Login attempt from unknown IP", time: "2 hr ago", type: "alert" },
];

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Enterprise Overview</h1>
            <p className="page-subtitle">Meridian Capital Group — Last updated 2 minutes ago</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="badge-encrypted">
              <Shield className="h-3 w-3" />
              AES-256 Secured
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard title="Encrypted Assets" value="467" change="+12.4% this month" changeType="positive" icon={Vault} />
          <MetricCard title="Verified Documents" value="1,284" change="+8 this week" changeType="positive" icon={FileCheck} />
          <MetricCard title="Pending Triggers" value="3" change="2 urgent" changeType="negative" icon={Clock} />
          <MetricCard title="Fraud Alerts" value="1" change="Low severity" changeType="neutral" icon={AlertTriangle} />
          <MetricCard title="Notarizations" value="892" change="+34 this month" changeType="positive" icon={Link2} />
          <MetricCard title="Active Nominees" value="24" change="All verified" changeType="positive" icon={Users} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Vault Growth */}
          <div className="card-enterprise p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="section-title">Monthly Vault Growth</h3>
                <p className="text-xs text-muted-foreground">Total encrypted assets over time</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                +31.2%
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={vaultGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="assets"
                  stroke="hsl(226, 82%, 48%)"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(226, 82%, 48%)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Asset Distribution */}
          <div className="card-enterprise p-5">
            <h3 className="section-title mb-1">Asset Distribution</h3>
            <p className="text-xs text-muted-foreground mb-4">By category</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {assetDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Risk Score */}
          <div className="card-enterprise p-5">
            <h3 className="section-title mb-1">AI Risk Score</h3>
            <p className="text-xs text-muted-foreground mb-6">Fraud monitoring assessment</p>
            <div className="flex flex-col items-center">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(220, 14%, 96%)" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth="10"
                    strokeDasharray={`${(87 / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">87</span>
                  <span className="text-[10px] text-muted-foreground">/ 100</span>
                </div>
              </div>
              <div className="badge-success mt-4">Low Risk</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-enterprise p-5 lg:col-span-2">
            <h3 className="section-title mb-1">Recent Activity</h3>
            <p className="text-xs text-muted-foreground mb-4">Latest platform events</p>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === "vault" ? "bg-primary/10" :
                    item.type === "verify" ? "bg-success/10" :
                    item.type === "nominee" ? "bg-info/10" :
                    item.type === "blockchain" ? "bg-warning/10" :
                    "bg-destructive/10"
                  }`}>
                    {item.type === "vault" && <Vault className="h-4 w-4 text-primary" />}
                    {item.type === "verify" && <FileCheck className="h-4 w-4 text-success" />}
                    {item.type === "nominee" && <Users className="h-4 w-4 text-info" />}
                    {item.type === "blockchain" && <Link2 className="h-4 w-4 text-warning" />}
                    {item.type === "alert" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.entity}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
