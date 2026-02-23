import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, Wallet, Globe, CheckCircle2, Clock, ExternalLink, FileCheck, ShieldCheck } from "lucide-react";

const transactions = [
  { hash: "0x8f3a7b2c1d9e4f5a...d12e", asset: "Goldman Sachs Trust Account", timestamp: "2026-02-22 14:30:12 UTC", status: "Verified", link: "#" },
  { hash: "0x2b7c9d4e5f1a3b8c...a98f", asset: "Manhattan Penthouse Deed", timestamp: "2026-02-21 09:15:44 UTC", status: "Verified", link: "#" },
  { hash: "0x4d1e6f2a8b3c9d7e...c67b", asset: "Bitcoin Wallet (Cold Storage)", timestamp: "2026-02-20 16:45:03 UTC", status: "Verified", link: "#" },
  { hash: "0x9a2f3b7c1d8e4f5a...e34d", asset: "Estate Planning Agreement", timestamp: "2026-02-19 11:20:56 UTC", status: "Pending", link: "#" },
  { hash: "0x6c8b4d1e2f9a3b7c...f91a", asset: "Life Insurance Policy #4821", timestamp: "2026-02-18 08:00:31 UTC", status: "Verified", link: "#" },
];

export default function BlockchainNotarization() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Blockchain Notarization</h1>
          <p className="page-subtitle">Immutable proof-of-existence records on Ethereum mainnet</p>
        </div>

        {/* Wallet + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-enterprise p-5 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="section-title text-sm">Connected Wallet</h3>
            </div>
            <p className="font-mono text-xs text-foreground mb-1">0x1a2B...9cDe</p>
            <div className="flex items-center gap-2">
              <div className="badge-success"><Globe className="h-3 w-3" />Ethereum Mainnet</div>
            </div>
          </div>

          {[
            { label: "Total Notarized", value: "892", icon: Link2 },
            { label: "Pending", value: "4", icon: Clock },
            { label: "Verified", value: "888", icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.label} className="card-enterprise p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="stat-label">{s.label}</span>
              </div>
              <span className="stat-value">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="gap-2"><FileCheck className="h-4 w-4" />Generate Proof of Existence</Button>
          <Button variant="outline" className="gap-2"><ShieldCheck className="h-4 w-4" />Verify Blockchain Record</Button>
        </div>

        {/* Table */}
        <div className="card-enterprise overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Tx Hash</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Asset</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Verify</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-foreground">{tx.hash}</TableCell>
                  <TableCell className="text-sm text-foreground">{tx.asset}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{tx.timestamp}</TableCell>
                  <TableCell>
                    <span className={tx.status === "Verified" ? "badge-success" : "badge-warning"}>
                      {tx.status === "Verified" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {tx.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary"><ExternalLink className="h-3 w-3" />View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
