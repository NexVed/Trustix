import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Shield, MoreHorizontal, UserPlus, RefreshCw, Upload, FileText, Loader2 } from "lucide-react";
import { useVault } from "@/contexts/VaultContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  file_name: string;
  category: string;
  uploaded_by: string;
  gcs_path: string;
  encryption_iv: string;
  created_at: string;
  vault_id: string;
}

export default function AssetVault() {
  const { vaultId, role, token: vaultToken } = useVault();
  const { session } = useAuth();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch documents for this vault
  useEffect(() => {
    if (!vaultId) {
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        const authToken = vaultToken || session?.access_token;
        const params = new URLSearchParams();
        if (categoryFilter !== "all") params.set("category", categoryFilter);

        const response = await fetch(`${API_URL}/documents?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDocuments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch documents", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [vaultId, vaultToken, session?.access_token, categoryFilter]);

  const handleUpload = async (file: File, category: string) => {
    if (!vaultToken) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const response = await fetch(`${API_URL}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vaultToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments((prev) => [data, ...prev]);
        toast({ title: "Document Uploaded", description: `${file.name} was encrypted and stored.` });
      } else {
        const err = await response.json().catch(() => ({}));
        toast({ title: "Upload Failed", description: err.detail || "Failed to upload document.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error uploading document.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (searchQuery) {
      return doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  if (!vaultId) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-12 p-12 card-enterprise text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Vault Selected</h3>
          <p className="text-sm text-muted-foreground">Go to the Dashboard and create or access a vault to manage documents.</p>
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
            {role !== 'nominee' && (
              <label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, "other");
                    e.target.value = "";
                  }}
                />
                <Button size="sm" className="gap-2 cursor-pointer" asChild>
                  <span>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Upload Document
                  </span>
                </Button>
              </label>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card-enterprise p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm bg-muted rounded-lg px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search documents..."
                className="bg-transparent border-none outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="wills">Wills</SelectItem>
                <SelectItem value="legal_contracts">Legal Contracts</SelectItem>
                <SelectItem value="property_documents">Property Documents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="card-enterprise overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Document Name</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Category</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Uploaded By</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Encryption</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {doc.file_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">{doc.category.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.uploaded_by}</TableCell>
                    <TableCell><span className="badge-encrypted"><Shield className="h-3 w-3" />E2E AES</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                    No documents found. {role !== 'nominee' ? 'Upload a PDF to get started.' : ''}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
