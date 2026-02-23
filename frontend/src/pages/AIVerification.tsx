import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  const [verified, setVerified] = useState(true);

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
              className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
              onClick={() => { setProcessing(true); setTimeout(() => setProcessing(false), 2000); }}
            >
              {processing ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">AI Processing Document...</p>
                  <p className="text-xs text-muted-foreground">Extracting data & running fraud analysis</p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Drag & drop documents here</p>
                  <p className="text-xs text-muted-foreground">Supports PDF, DOCX, PNG, JPG — Max 50MB — AES-256 encrypted</p>
                  <Button variant="outline" size="sm">Browse Files</Button>
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
