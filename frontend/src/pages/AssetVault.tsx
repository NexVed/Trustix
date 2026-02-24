import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Shield, MoreHorizontal, UserPlus, RefreshCw, Upload, FileText, Loader2 } from "lucide-react";

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
  const [role, setRole] = useState<'owner' | 'nominee' | null>(null);
  const [isOcrVerified, setIsOcrVerified] = useState(false);
  const [nomineeEmail, setNomineeEmail] = useState("");

  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [ocrError, setOcrError] = useState("");

  useEffect(() => {
    const vaultToken = localStorage.getItem('trustix.vault.token');
    if (vaultToken) {
      try {
        const payload = JSON.parse(atob(vaultToken.split('.')[1]));
        setRole(payload.role || 'owner');
        setIsOcrVerified(payload.is_ocr_verified !== false);
        if (payload.nominee_email) setNomineeEmail(payload.nominee_email);
      } catch (e) {
        console.error("Failed to parse vault token", e);
      }
    }
  }, []);

  const handleOcrVerification = async () => {
    if (!ocrFile) return;
    setIsVerifying(true);
    setOcrError("");

    try {
      const vaultToken = localStorage.getItem('trustix.vault.token');
      const formData = new FormData();
      formData.append("file", ocrFile);
      formData.append("nominee_email", nomineeEmail);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/verification/nominee-ocr`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vaultToken}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Verification failed");
      }

      // Update the vault token with the newly issued one
      localStorage.setItem('trustix.vault.token', data.access_token);
      setIsOcrVerified(true);
    } catch (e: any) {
      setOcrError(e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (role === 'nominee' && !isOcrVerified) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-12 p-8 bg-white border rounded-xl shadow-sm text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Identity Verification Required</h2>
          <p className="text-muted-foreground mb-8">
            As a nominee, you must verify your identity to access this vault. Please upload a clear photo of your government-issued ID.
          </p>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 mb-6 transition-all hover:bg-slate-100">
            <input
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              id="id-upload"
              onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="id-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
              {ocrFile ? (
                <>
                  <FileText className="h-10 w-10 text-blue-600 mb-2" />
                  <span className="font-medium text-slate-800">{ocrFile.name}</span>
                  <span className="text-sm text-blue-600 mt-2 font-medium">Click to change file</span>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-slate-400 mb-2" />
                  <span className="font-medium text-slate-600">Click to upload your ID</span>
                  <span className="text-sm text-slate-400 mt-1">JPEG or PNG only (Max 5MB)</span>
                </>
              )}
            </label>
          </div>

          {ocrError && <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{ocrError}</div>}

          <Button
            className="w-full h-12 text-lg"
            disabled={!ocrFile || isVerifying}
            onClick={handleOcrVerification}
          >
            {isVerifying ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying Identity...</> : 'Verify Identity'}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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
            {role !== 'nominee' && <Button size="sm" className="gap-2"><Shield className="h-3.5 w-3.5" />Add Asset</Button>}
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
        {role !== 'nominee' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><UserPlus className="h-3 w-3" />Assign Nominee</Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"><RefreshCw className="h-3 w-3" />Re-verify</Button>
          </div>
        )}

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
