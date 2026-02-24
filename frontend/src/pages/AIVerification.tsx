import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Scale,
  ShieldCheck,
} from "lucide-react";

const extractedData = {
  name: "Estate Planning Agreement v3",
  date: "2026-01-15",
  type: "Legal Document — Trust & Succession",
  issuer: "Morrison & Partners LLP",
  signatories: "James Reynolds, Sarah Reynolds",
  jurisdiction: "New York, United States",
};

const validationChecks = [
  { label: "Name match verification", passed: true, icon: CheckCircle2 },
  { label: "Date validation & consistency", passed: true, icon: CheckCircle2 },
  { label: "Digital signature detection", passed: true, icon: CheckCircle2 },
  { label: "Tampering & alteration detection", passed: false, icon: XCircle },
];

export default function AIVerification() {
  const [processing, setProcessing] = useState(false);
  const [verified, setVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setVerified(false);

    try {
      // Fetch the Vault Session JWT from localStorage (set by VaultAccess)
      const token = localStorage.getItem('trustix.vault.token');

      if (!token) {
        toast({
          title: "Upload Failed",
          description: "Please unlock your Vault from the Dashboard first before uploading encrypted documents.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "legal_contracts"); // Default for AI Verification

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/documents/upload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = "Upload failed. Please try again.";
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) { }

        console.error("Upload failed", errorMsg);
        toast({
          title: "Upload Failed",
          description: errorMsg.includes("Vault session invalid")
            ? "Please unlock your Vault from the Dashboard first before uploading encrypted documents."
            : errorMsg,
          variant: "destructive",
        });
        setProcessing(false);
        return;
      } else {
        console.log("Upload success", await response.json());
        toast({
          title: "Upload Successful",
          description: "Document encrypted and securely stored in Google Cloud.",
        });
      }
    } catch (error) {
      console.error("Error during upload:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to the backend server. Make sure it's running.",
        variant: "destructive"
      });
      setProcessing(false);
      return;
    } finally {
      // Show Verification UI shortly after
      setTimeout(() => {
        setProcessing(false);
        setVerified(true);
      }, 1500);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">AI Document Verification</h1>
          <p className="page-subtitle">Secure upload, AI-powered fraud detection & structured data extraction</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Zone */}
          <div className="card-enterprise p-6">
            <h3 className="section-title mb-4">Secure Document Upload</h3>
            <div
              className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer relative"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.png,.jpeg,.jpg,.docx"
              />
              {processing ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">Securely Uploading & AI Processing...</p>
                  <p className="text-xs text-muted-foreground">Encrypting (AES-256) & uploading to Private Cloud</p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Click or Drag & drop documents here</p>
                  <p className="text-xs text-muted-foreground">Supports PDF, DOCX, PNG, JPG — Max 50MB — AES-256 encrypted</p>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Browse Files
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Extracted Data */}
          {verified && (
            <div className="card-enterprise p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="h-5 w-5 text-primary" />
                <h3 className="section-title">Extracted Data</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(extractedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start gap-4 py-2 border-b border-border last:border-0">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[100px]">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-sm font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {verified && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fraud Score */}
            <div className="card-enterprise p-6">
              <h3 className="section-title mb-4">Fraud Probability</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Risk Score</span>
                  <span className="text-sm font-bold text-foreground">12%</span>
                </div>
                <Progress value={12} className="h-3" />
                <div className="badge-success inline-flex">Low Fraud Risk</div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confidence Score</span>
                  <span className="text-sm font-bold text-foreground">94.7%</span>
                </div>
                <Progress value={94.7} className="h-3" />
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="card-enterprise p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="section-title">Validation Checklist</h3>
              </div>
              <div className="space-y-3">
                {validationChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <check.icon className={`h-5 w-5 shrink-0 ${check.passed ? "text-success" : "text-destructive"}`} />
                    <span className="text-sm text-foreground">{check.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="card-enterprise p-6 flex flex-col">
              <h3 className="section-title mb-4">Verification Actions</h3>
              <div className="flex-1 space-y-3">
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium text-foreground">Attention Required</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Tampering detection flagged minor anomalies in document metadata. Manual review recommended.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-6">
                <Button variant="outline" className="gap-2">
                  <Scale className="h-4 w-4" />
                  Escalate to Legal Review
                </Button>
                <Button className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Verification
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
