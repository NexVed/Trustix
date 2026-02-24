import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Activity, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useVault } from "@/contexts/VaultContext";

interface ActivityItem {
  id?: string;
  created_at: string;
  action: string;
  entity: string;
  type: string;
  user_id: string;
}

const actionColors: Record<string, string> = {
  "Asset Encrypted": "bg-primary/10 text-primary",
  "Document Verified": "bg-success/10 text-success",
  "Nominee Approved": "bg-info/10 text-info",
  "Login Attempt": "bg-destructive/10 text-destructive",
  "Report Exported": "bg-warning/10 text-warning",
  "Blockchain Notarized": "bg-primary/10 text-primary",
  "Scheduled Scan": "bg-muted text-muted-foreground",
  "Permission Updated": "bg-info/10 text-info",
  "Vault Created": "bg-success/10 text-success",
  "Nominee Added": "bg-info/10 text-info",
  "Team Invitation Sent": "bg-warning/10 text-warning",
  "Document Uploaded": "bg-primary/10 text-primary",
};

export default function ActivityLedger() {
  const { session } = useAuth();
  const { vaultId, token: vaultToken } = useVault();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const pageSize = 15;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const authToken = session?.access_token || vaultToken;
      if (!authToken) return;

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (vaultId) params.set("vault_id", vaultId);
      if (actionFilter !== "all") params.set("action", actionFilter);

      const response = await fetch(`${API_URL}/activities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [session?.access_token, vaultToken, vaultId, page, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  const getInitials = (action: string) => {
    return action.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Activity Ledger</h1>
            <p className="page-subtitle">Chronological record of all vault events</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setPage(1); fetchActivities(); }}>
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="card-enterprise p-4 flex flex-wrap items-center gap-3">
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="All Actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="Asset Encrypted">Asset Encrypted</SelectItem>
              <SelectItem value="Document Verified">Document Verified</SelectItem>
              <SelectItem value="Document Uploaded">Document Uploaded</SelectItem>
              <SelectItem value="Nominee Added">Nominee Added</SelectItem>
              <SelectItem value="Nominee Approved">Nominee Approved</SelectItem>
              <SelectItem value="Vault Created">Vault Created</SelectItem>
              <SelectItem value="Login Attempt">Login Attempt</SelectItem>
              <SelectItem value="Team Invitation Sent">Team Invitation Sent</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{total} total events</span>
        </div>

        {/* Table */}
        <div className="card-enterprise overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Action</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Entity</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(4).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : activities.length > 0 ? (
                activities.map((a, i) => (
                  <TableRow key={a.id || i}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[a.action] || "bg-muted text-muted-foreground"}`}>
                        {a.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">{a.entity}</TableCell>
                    <TableCell>
                      <span className={a.type === "Success" ? "badge-success" : a.type === "Failed" ? "badge-destructive" : "badge-warning"}>
                        {a.type}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                    No activities recorded yet. Events will appear here as you use the vault.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `Showing ${startIdx}–${endIdx} of ${total} events` : "No events"}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(p)}>{p}</Button>
            ))}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
