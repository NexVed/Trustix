import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Users, Link2, ShieldCheck } from "lucide-react";

const reports = [
  { title: "Asset Summary Report", description: "Complete inventory of encrypted assets with status and nominee assignments.", icon: FileText, stats: "467 assets · Last generated Feb 20", color: "bg-primary/10 text-primary" },
  { title: "Nominee Allocation Report", description: "Nominee distribution, approval statuses, and trigger condition analysis.", icon: Users, stats: "24 nominees · 4 pending", color: "bg-info/10 text-info" },
  { title: "Blockchain Verification Report", description: "All notarized records with transaction hashes and verification status.", icon: Link2, stats: "892 records · 99.6% verified", color: "bg-success/10 text-success" },
  { title: "Compliance Audit Report", description: "Regulatory compliance scores, GDPR status, and data retention policies.", icon: ShieldCheck, stats: "92% compliance · 0 violations", color: "bg-warning/10 text-warning" },
];

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and export enterprise compliance and asset reports</p>
        </div>

        {/* Date Range */}
        <div className="card-enterprise p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground">Date Range:</span>
          <Input type="date" className="w-[160px] h-9" defaultValue="2026-01-01" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" className="w-[160px] h-9" defaultValue="2026-02-22" />
        </div>

        {/* Report Cards */}
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
              <p className="text-xs text-muted-foreground mb-4">{r.stats}</p>
              <div className="flex gap-2 mt-auto">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1"><Download className="h-3 w-3" />Download PDF</Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1"><Download className="h-3 w-3" />Download CSV</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
