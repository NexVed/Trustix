import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import VaultCreationPopup from "@/components/trustix-vault/VaultCreationPopup";
import VaultPortalModal from "@/components/trustix-vault/VaultPortalModal";
import VaultAccess from "@/components/vault/VaultAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { ZerodhaConnect } from "../components/zerodha/ZerodhaConnect";
import { Portfolio } from "../components/zerodha/Portfolio";
import { ConnectWallet } from "../components/wallet/ConnectWallet";
import { SignMessage } from "../components/wallet/SignMessage";
import { GenerateWallet } from "../components/wallet/GenerateWallet";
import {
  Vault,
  FileCheck,
  Clock,
  AlertTriangle,
  Link2,
  Users,
  TrendingUp,
  Shield,
  PlusCircle
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

import { Skeleton } from "@/components/ui/skeleton";

interface DashboardSummary {
  metrics: {
    encrypted_assets: number;
    verified_documents: number;
    pending_triggers: number;
    fraud_alerts: number;
    notarizations: number;
    active_nominees: number;
  };
  charts: {
    vault_growth: { month: string; assets: number }[];
    asset_distribution: { name: string; value: number }[];
  };
  recent_activity: {
    action: string;
    entity: string;
    type: string;
    time: string;
  }[];
}

const COLORS = [
  "hsl(226, 82%, 48%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(280, 65%, 60%)",
];

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'portal' | 'create' | 'access' | 'dashboard'>('portal');
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch real data when dashboard is activated
  useEffect(() => {
    if (activeView === 'dashboard') {
      const fetchSummary = async () => {
        try {
          // If using a custom hook for fetch or just straight up fetch:
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const token = session?.access_token;

          if (!token) return;

          const response = await fetch(`${API_URL}/dashboard/summary`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setSummaryData(data);
          }
        } catch (error) {
          console.error("Failed to fetch dashboard summary", error);
        } finally {
          setIsInitializing(false);
        }
      };

      fetchSummary();
    }

  }, [activeView, session?.access_token]);

  return (
    <DashboardLayout>
      <VaultPortalModal
        isOpen={activeView === 'portal'}
        onCreateVault={() => setActiveView('create')}
        onAccessVault={() => setActiveView('access')}
        preventClose={true}
      />

      <VaultCreationPopup
        isOpen={activeView === 'create'}
        onClose={() => setActiveView('dashboard')}
      />

      <AnimatePresence>
        {activeView === 'access' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg z-50" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setActiveView('portal')}
                className="absolute top-2 right-2 p-2 z-[60] bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 dark:text-zinc-400">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <VaultAccess onUnlocked={(key) => {
                setActiveView('dashboard');
                navigate('/zk-vault', { state: { encryptionKey: key } });
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Enterprise Overview</h1>
              <p className="page-subtitle">Meridian Capital Group — Last updated 2 minutes ago</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('create')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                title="Create Trustix Vault"
              >
                <PlusCircle className="w-4 h-4" />
                Create Trustix Vault
              </button>
              <div className="badge-encrypted">
                <Shield className="h-3 w-3" />
                AES-256 Secured
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {isInitializing || !summaryData ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            ) : (
              <>
                <MetricCard title="Encrypted Assets" value={summaryData.metrics.encrypted_assets.toString()} change="Total active nodes" changeType="neutral" icon={Vault} />
                <MetricCard title="Verified Documents" value={summaryData.metrics.verified_documents.toString()} change="AI Processed" changeType="neutral" icon={FileCheck} />
                <MetricCard title="Pending Triggers" value={summaryData.metrics.pending_triggers.toString()} change="Awaiting Action" changeType="neutral" icon={Clock} />
                <MetricCard title="Fraud Alerts" value={summaryData.metrics.fraud_alerts.toString()} change="Monitoring active" changeType="neutral" icon={AlertTriangle} />
                <MetricCard title="Notarizations" value={summaryData.metrics.notarizations.toString()} change="On-chain" changeType="neutral" icon={Link2} />
                <MetricCard title="Active Nominees" value={summaryData.metrics.active_nominees.toString()} change="Registered keys" changeType="neutral" icon={Users} />
              </>
            )}
          </div>

          {/* Zerodha Portfolio Integration */}
          <div className="mt-8">
            <ZerodhaConnect />
            <Portfolio />
          </div>

          {/* Web3 Wallet Integration */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <ConnectWallet />
              <SignMessage />
            </div>
            <div className="flex flex-col">
              <GenerateWallet />
            </div>
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
              {isInitializing || !summaryData ? (
                <Skeleton className="w-full h-[260px] rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={summaryData.charts.vault_growth}>
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
              )}
            </div>

            {/* Asset Distribution */}
            <div className="card-enterprise p-5">
              <h3 className="section-title mb-1">Asset Distribution</h3>
              <p className="text-xs text-muted-foreground mb-4">By category</p>
              {isInitializing || !summaryData ? (
                <Skeleton className="w-full h-[180px] rounded-xl" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={summaryData.charts.asset_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {summaryData.charts.asset_distribution.map((_, index) => (
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
                    {summaryData.charts.asset_distribution.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                {isInitializing || !summaryData ? (
                  Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
                ) : summaryData.recent_activity.length > 0 ? (
                  summaryData.recent_activity.map((item, i) => {
                    // Simple relative time display
                    let displayTime = "Just now";
                    try {
                      const msAgo = Date.now() - new Date(item.time).getTime();
                      if (msAgo > 86400000) displayTime = `${Math.floor(msAgo / 86400000)} d ago`;
                      else if (msAgo > 3600000) displayTime = `${Math.floor(msAgo / 3600000)} h ago`;
                      else if (msAgo > 60000) displayTime = `${Math.floor(msAgo / 60000)} m ago`;
                    } catch (e) { /* ignore parse error */ }

                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === "vault" ? "bg-primary/10" :
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
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{displayTime}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground py-8 text-center italic">No recent activity detected. Connect a vault or add nominees to get started.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;
