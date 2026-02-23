import { DashboardLayout } from "@/components/DashboardLayout";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const auditLogs = [
  { timestamp: "2026-02-22 14:32:01", actor: "James Reynolds", action: "Asset encrypted", result: "Success", ip: "New York, US" },
  { timestamp: "2026-02-22 14:30:12", actor: "System — AI Engine", action: "Document verification", result: "Success", ip: "Cloud — AWS us-east-1" },
  { timestamp: "2026-02-22 12:15:44", actor: "Sarah Chen", action: "Nominee approval", result: "Success", ip: "London, UK" },
  { timestamp: "2026-02-22 10:05:33", actor: "Unknown", action: "Login attempt", result: "Failed", ip: "Lagos, NG" },
  { timestamp: "2026-02-21 18:22:10", actor: "Michael Torres", action: "Export compliance report", result: "Success", ip: "San Francisco, US" },
  { timestamp: "2026-02-21 15:48:29", actor: "James Reynolds", action: "Blockchain notarization", result: "Success", ip: "New York, US" },
  { timestamp: "2026-02-21 11:10:55", actor: "System", action: "Scheduled audit scan", result: "Warning", ip: "Cloud — AWS eu-west-1" },
];

export default function ComplianceAudit() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Compliance & Audit</h1>
          <p className="page-subtitle">Regulatory compliance monitoring & immutable audit ledger</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compliance Score */}
          <div className="card-enterprise p-6">
            <h3 className="section-title mb-1">Compliance Score</h3>
            <p className="text-xs text-muted-foreground mb-6">Overall regulatory compliance</p>
            <div className="flex flex-col items-center">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(220, 14%, 96%)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(142, 71%, 45%)" strokeWidth="10" strokeDasharray={`${(92 / 100) * 314} 314`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">92%</span>
                  <span className="text-[10px] text-muted-foreground">Compliant</span>
                </div>
              </div>
              <div className="badge-success mt-4">Passing</div>
            </div>
          </div>

          {/* GDPR & Policies */}
          <div className="card-enterprise p-6 lg:col-span-2">
            <h3 className="section-title mb-6">Policy Configuration</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">GDPR Compliance Mode</p>
                    <p className="text-xs text-muted-foreground">Enable EU data protection regulations</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Data Retention Policy</p>
                    <p className="text-xs text-muted-foreground">Automatic data lifecycle management</p>
                  </div>
                </div>
                <Select defaultValue="7years">
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
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

        {/* Audit Log */}
        <div className="card-enterprise overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h3 className="section-title">Immutable Audit Ledger</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Actor</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Action</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Result</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">IP / Location</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                  <TableCell className="text-sm text-foreground">{log.actor}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.action}</TableCell>
                  <TableCell>
                    <span className={log.result === "Success" ? "badge-success" : log.result === "Failed" ? "badge-destructive" : "badge-warning"}>
                      {log.result === "Success" && <CheckCircle2 className="h-3 w-3" />}
                      {log.result === "Failed" && <XCircle className="h-3 w-3" />}
                      {log.result === "Warning" && <AlertTriangle className="h-3 w-3" />}
                      {log.result}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.ip}</TableCell>
                  <TableCell><Lock className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
