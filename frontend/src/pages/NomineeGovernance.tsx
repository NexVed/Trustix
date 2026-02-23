import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, CheckCircle2, Clock, AlertTriangle, Users, Shield } from "lucide-react";

const nominees = [
  { name: "Sarah Reynolds", assets: 4, verification: "Level 3 — Biometric", legalApproval: "Approved", multiParty: "3/3 Approved", trigger: "180-day inactivity" },
  { name: "Michael Reynolds", assets: 3, verification: "Level 2 — KYC", legalApproval: "Approved", multiParty: "3/3 Approved", trigger: "Incapacitation certificate" },
  { name: "Trust Fund (Meridian)", assets: 2, verification: "Level 3 — Institutional", legalApproval: "Pending Review", multiParty: "2/3 Approved", trigger: "Death certificate" },
  { name: "Board of Directors", assets: 1, verification: "Level 1 — Basic", legalApproval: "Under Review", multiParty: "1/3 Approved", trigger: "Annual review cycle" },
];

const approvalSteps = [
  { label: "Identity Verified", done: true },
  { label: "KYC/AML Complete", done: true },
  { label: "Legal Review", done: true },
  { label: "Multi-Party Sign", done: false },
  { label: "Final Approval", done: false },
];

const timeline = [
  { date: "Day 0", label: "Last Activity", active: true },
  { date: "Day 30", label: "First Reminder", active: false },
  { date: "Day 90", label: "Escalation", active: false },
  { date: "Day 150", label: "Legal Notice", active: false },
  { date: "Day 180", label: "Trigger Activation", active: false },
];

export default function NomineeGovernance() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Nominee Governance</h1>
            <p className="page-subtitle">Multi-party approval workflows & dead-man switch configuration</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="h-4 w-4" />Add Nominee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Nominee</DialogTitle>
                <DialogDescription>Configure a new nominee for asset inheritance governance.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Full Legal Name</Label><Input placeholder="Enter full name" /></div>
                <div className="space-y-2"><Label>Email Address</Label><Input type="email" placeholder="nominee@email.com" /></div>
                <div className="space-y-2"><Label>Verification Level</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger><SelectContent><SelectItem value="l1">Level 1 — Basic</SelectItem><SelectItem value="l2">Level 2 — KYC</SelectItem><SelectItem value="l3">Level 3 — Biometric</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Trigger Condition</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger><SelectContent><SelectItem value="inactivity">180-day inactivity</SelectItem><SelectItem value="death">Death certificate</SelectItem><SelectItem value="incapacitation">Incapacitation certificate</SelectItem></SelectContent></Select>
                </div>
              </div>
              <DialogFooter><Button>Submit for Approval</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <div className="card-enterprise overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Nominee Name</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Assets</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Verification</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Legal Approval</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Multi-Party</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Trigger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nominees.map((n, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm text-foreground flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{n.name}</TableCell>
                  <TableCell className="text-sm text-foreground">{n.assets}</TableCell>
                  <TableCell><span className="badge-encrypted"><Shield className="h-3 w-3" />{n.verification}</span></TableCell>
                  <TableCell>
                    <span className={n.legalApproval === "Approved" ? "badge-success" : n.legalApproval === "Pending Review" ? "badge-warning" : "badge-encrypted"}>
                      {n.legalApproval === "Approved" && <CheckCircle2 className="h-3 w-3" />}
                      {n.legalApproval === "Pending Review" && <Clock className="h-3 w-3" />}
                      {n.legalApproval === "Under Review" && <AlertTriangle className="h-3 w-3" />}
                      {n.legalApproval}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{n.multiParty}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{n.trigger}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approval Chain */}
          <div className="card-enterprise p-6">
            <h3 className="section-title mb-6">Approval Chain Configuration</h3>
            <div className="flex items-center gap-2">
              {approvalSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`flex flex-col items-center gap-1.5 flex-1`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {step.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{step.label}</span>
                  </div>
                  {i < approvalSteps.length - 1 && <div className={`h-0.5 flex-1 mt-[-16px] ${step.done ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Dead-man Switch Timeline */}
          <div className="card-enterprise p-6">
            <h3 className="section-title mb-6">Dead-Man Switch Timeline</h3>
            <div className="relative">
              <div className="absolute top-3 left-0 right-0 h-1 bg-border rounded-full" />
              <div className="absolute top-3 left-0 h-1 bg-primary rounded-full" style={{ width: "10%" }} />
              <div className="flex justify-between relative">
                {timeline.map((t, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`h-7 w-7 rounded-full border-2 z-10 flex items-center justify-center ${t.active ? "border-primary bg-primary" : "border-border bg-card"}`}>
                      {t.active && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                    </div>
                    <span className="text-[10px] font-semibold text-foreground">{t.date}</span>
                    <span className="text-[9px] text-muted-foreground text-center">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
