import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Shield, MoreHorizontal, UserPlus, RefreshCw } from "lucide-react";

const assets = [
  { name: "Goldman Sachs Trust Account", category: "Financial", owner: "James Reynolds", encrypted: true, hash: "0x8f3a...d12e", nominee: "Sarah Reynolds", lastAudit: "2026-02-22 14:30", status: "Active" },
  { name: "Manhattan Penthouse Deed", category: "Real Estate", owner: "James Reynolds", encrypted: true, hash: "0x2b7c...a98f", nominee: "Michael Reynolds", lastAudit: "2026-02-21 09:15", status: "Active" },
  { name: "Bitcoin Wallet (Cold Storage)", category: "Digital Asset", owner: "James Reynolds", encrypted: true, hash: "0x4d1e...c67b", nominee: "Sarah Reynolds", lastAudit: "2026-02-20 16:45", status: "Active" },
  { name: "Estate Planning Agreement", category: "Legal Document", owner: "Legal Dept", encrypted: true, hash: "0x9a2f...e34d", nominee: "—", lastAudit: "2026-02-19 11:20", status: "Under Review" },
  { name: "Life Insurance Policy #4821", category: "Insurance", owner: "James Reynolds", encrypted: true, hash: "0x6c8b...f91a", nominee: "Trust Fund", lastAudit: "2026-02-18 08:00", status: "Active" },
  { name: "Swiss Bank Account", category: "Financial", owner: "James Reynolds", encrypted: true, hash: "0x1e5d...b23c", nominee: "Michael Reynolds", lastAudit: "2026-02-17 13:50", status: "Active" },
  { name: "IP Portfolio — Patent Bundle", category: "Digital Asset", owner: "Corp Holdings", encrypted: true, hash: "0x7f4a...d56e", nominee: "Board of Directors", lastAudit: "2026-02-16 10:30", status: "Pending" },
];

export default function AssetVault() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Asset Vault</h1>
            <p className="page-subtitle">End-to-end encrypted asset management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2"><Download className="h-3.5 w-3.5" />Export</Button>
            <Button size="sm" className="gap-2"><Shield className="h-3.5 w-3.5" />Add Asset</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card-enterprise p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm bg-muted rounded-lg px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input placeholder="Search assets..." className="bg-transparent border-none outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground" />
            </div>
            <Select><SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Owner" /></SelectTrigger><SelectContent><SelectItem value="all">All Owners</SelectItem><SelectItem value="james">James Reynolds</SelectItem><SelectItem value="legal">Legal Dept</SelectItem></SelectContent></Select>
            <Select><SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Asset Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="financial">Financial</SelectItem><SelectItem value="real-estate">Real Estate</SelectItem><SelectItem value="digital">Digital Asset</SelectItem></SelectContent></Select>
            <Select><SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="review">Under Review</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground"><Filter className="h-3.5 w-3.5" />More Filters</Button>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><UserPlus className="h-3 w-3" />Assign Nominee</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><RefreshCw className="h-3 w-3" />Re-verify</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3 w-3" />Export Metadata</Button>
        </div>

        {/* Table */}
        <div className="card-enterprise overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Asset Name</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Category</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Owner</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Encryption</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Blockchain Hash</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Nominee</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Last Audit</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset, i) => (
                <TableRow key={i} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm text-foreground">{asset.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{asset.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{asset.owner}</TableCell>
                  <TableCell><span className="badge-encrypted"><Shield className="h-3 w-3" />E2E</span></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{asset.hash}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{asset.nominee}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{asset.lastAudit}</TableCell>
                  <TableCell>
                    <span className={asset.status === "Active" ? "badge-success" : asset.status === "Under Review" ? "badge-warning" : "badge-encrypted"}>
                      {asset.status}
                    </span>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
