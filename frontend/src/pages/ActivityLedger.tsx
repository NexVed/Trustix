import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";

const activities = [
  { timestamp: "2026-02-22 14:32:01", actor: "James Reynolds", initials: "JR", action: "Asset Encrypted", entity: "Goldman Sachs Trust Account", result: "Success", ip: "72.134.22.11" },
  { timestamp: "2026-02-22 14:30:12", actor: "AI Engine", initials: "AI", action: "Document Verified", entity: "Estate Planning Agreement v3", result: "Success", ip: "10.0.0.1" },
  { timestamp: "2026-02-22 12:15:44", actor: "Sarah Chen", initials: "SC", action: "Nominee Approved", entity: "Sarah Reynolds — Secondary", result: "Success", ip: "51.120.7.89" },
  { timestamp: "2026-02-22 10:05:33", actor: "Unknown", initials: "??", action: "Login Attempt", entity: "Admin Portal", result: "Failed", ip: "154.72.150.33" },
  { timestamp: "2026-02-21 18:22:10", actor: "Michael Torres", initials: "MT", action: "Report Exported", entity: "Q4 Compliance Report", result: "Success", ip: "67.180.234.12" },
  { timestamp: "2026-02-21 15:48:29", actor: "James Reynolds", initials: "JR", action: "Blockchain Notarized", entity: "Manhattan Penthouse Deed", result: "Success", ip: "72.134.22.11" },
  { timestamp: "2026-02-21 11:10:55", actor: "System", initials: "SY", action: "Scheduled Scan", entity: "Full Platform Audit", result: "Warning", ip: "10.0.0.1" },
  { timestamp: "2026-02-21 09:00:00", actor: "Sarah Chen", initials: "SC", action: "Permission Updated", entity: "Auditor Role — Export access", result: "Success", ip: "51.120.7.89" },
];

const actionColors: Record<string, string> = {
  "Asset Encrypted": "bg-primary/10 text-primary",
  "Document Verified": "bg-success/10 text-success",
  "Nominee Approved": "bg-info/10 text-info",
  "Login Attempt": "bg-destructive/10 text-destructive",
  "Report Exported": "bg-warning/10 text-warning",
  "Blockchain Notarized": "bg-primary/10 text-primary",
  "Scheduled Scan": "bg-muted text-muted-foreground",
  "Permission Updated": "bg-info/10 text-info",
};

export default function ActivityLedger() {
  const [page, setPage] = useState(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Activity Ledger</h1>
          <p className="page-subtitle">Comprehensive chronological record of all platform events</p>
        </div>

        {/* Filters */}
        <div className="card-enterprise p-4 flex flex-wrap items-center gap-3">
          <Input type="date" className="w-[160px] h-9" defaultValue="2026-02-01" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" className="w-[160px] h-9" defaultValue="2026-02-22" />
          <Select>
            <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="All Actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="encrypt">Asset Encrypted</SelectItem>
              <SelectItem value="verify">Document Verified</SelectItem>
              <SelectItem value="login">Login Attempt</SelectItem>
              <SelectItem value="export">Report Exported</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="card-enterprise overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Actor</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Action</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Entity</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Result</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.timestamp}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">{a.initials}</span>
                      </div>
                      <span className="text-sm text-foreground">{a.actor}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[a.action] || "bg-muted text-muted-foreground"}`}>
                      {a.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{a.entity}</TableCell>
                  <TableCell>
                    <span className={a.result === "Success" ? "badge-success" : a.result === "Failed" ? "badge-destructive" : "badge-warning"}>
                      {a.result}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing 1–8 of 1,247 events</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled><ChevronLeft className="h-4 w-4" /></Button>
            {[1, 2, 3].map((p) => (
              <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(p)}>{p}</Button>
            ))}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(2)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
