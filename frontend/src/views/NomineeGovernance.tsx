import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmptyState, MetricStrip, PageHeader, PanelHeading, VaultNotice } from "@/components/WorkspacePage";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, CheckCircle2, Clock, AlertTriangle, Users, Shield, Loader2, Copy, Check, AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import { useVault } from "@/contexts/VaultContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Nominee {
  id: string;
  name: string;
  email: string;
  verification_level: string;
  legal_approval: string;
  trigger_condition: string;
  asset_count: number;
  multi_party_status: string;
  created_at: string;
}

const approvalSteps = [
  { label: "Identity Verified", done: false },
  { label: "KYC/AML Complete", done: false },
  { label: "Legal Review", done: false },
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function NomineeGovernance() {
  const { vaultId, token: vaultToken } = useVault();
  const { session } = useAuth();
  const { toast } = useToast();

  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newVerification, setNewVerification] = useState("");
  const [newTrigger, setNewTrigger] = useState("");

  // Generated key display state
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [keyNomineeName, setKeyNomineeName] = useState("");

  // Fetch nominees
  useEffect(() => {
    if (!vaultId) {
      setLoading(false);
      return;
    }

    const fetchNominees = async () => {
      try {
        const authToken = session?.access_token || vaultToken;
        const response = await fetch(`${API_URL}/vault/${vaultId}/nominees`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNominees(data.nominees || []);
        }
      } catch (error) {
        console.error("Failed to fetch nominees", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNominees();
  }, [vaultId, session?.access_token, vaultToken]);

  const handleAddNominee = async () => {
    if (!newName || !newEmail) return;
    setAdding(true);

    try {
      const authToken = session?.access_token || vaultToken;
      const response = await fetch(`${API_URL}/vault/${vaultId}/nominees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          verification_level: newVerification || 'Level 1 — Basic',
          trigger_condition: newTrigger || '180-day inactivity',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNominees((prev) => [...prev, data.nominee]);

        // Show the generated key
        setGeneratedKey(data.nominee_secret_key);
        setKeyNomineeName(newName);
        setKeyCopied(false);
        setKeyRevealed(false);
        setAddOpen(false);
        setKeyDialogOpen(true);

        setNewName(""); setNewEmail(""); setNewVerification(""); setNewTrigger("");
        toast({ title: "Nominee Added", description: `${newName} has been added. Share the secret key with them.` });
      } else {
        const err = await response.json().catch(() => ({}));
        toast({ title: "Error", description: err.detail || "Failed to add nominee.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error adding nominee.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2500);
    }
  };

  return (
    <DashboardLayout>
      <div className="ws-page">
        <PageHeader title="Trusted nominees" description="The people entrusted with your digital legacy." actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!vaultId}><UserPlus className="h-4 w-4" />Add Nominee</Button>
            </DialogTrigger>
            <DialogContent className="ws-dialog">
              <DialogHeader>
                <DialogTitle>Add New Nominee</DialogTitle>
                <DialogDescription>Configure a new nominee for asset inheritance governance.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Full Legal Name</Label><Input placeholder="Enter full name" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Email Address</Label><Input type="email" placeholder="nominee@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Verification Level</Label>
                  <Select value={newVerification} onValueChange={setNewVerification}><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger><SelectContent><SelectItem value="Level 1 — Basic">Level 1 — Basic</SelectItem><SelectItem value="Level 2 — KYC">Level 2 — KYC</SelectItem><SelectItem value="Level 3 — Biometric">Level 3 — Biometric</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Trigger Condition</Label>
                  <Select value={newTrigger} onValueChange={setNewTrigger}><SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger><SelectContent><SelectItem value="180-day inactivity">180-day inactivity</SelectItem><SelectItem value="Death certificate">Death certificate</SelectItem><SelectItem value="Incapacitation certificate">Incapacitation certificate</SelectItem></SelectContent></Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddNominee} disabled={adding || !newName || !newEmail}>
                  {adding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Key...</> : "Add & Generate Key"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />
        {!vaultId && <VaultNotice />}
        <MetricStrip items={[
          { label: "Nominees", value: loading ? "..." : nominees.length, detail: "In your trusted circle", icon: Users },
          { label: "Approved", value: nominees.filter(n => n.legal_approval === "Approved").length, detail: "Legal approval complete", icon: CheckCircle2, tone: "cyan" },
          { label: "Awaiting approval", value: nominees.filter(n => n.legal_approval !== "Approved").length, detail: "Pending review", icon: Clock, tone: "amber" },
          { label: "Assigned assets", value: nominees.reduce((sum, n) => sum + (n.asset_count || 0), 0), detail: "Across all nominees", icon: Shield, tone: "navy" },
        ]} />

        {/* Secret Key Display Dialog — shown after adding a nominee */}
        <Dialog open={keyDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setGeneratedKey(null);
            setKeyRevealed(false);
          }
          setKeyDialogOpen(open);
        }}>
          <DialogContent className="ws-dialog max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600" /> Nominee Secret Key Generated
              </DialogTitle>
              <DialogDescription>
                A unique secret key has been generated for <strong>{keyNomineeName}</strong>. This key can be used to unlock the vault.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Nominee Secret Key</Label>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-x-auto">
                    {keyRevealed ? (
                      <span className="font-mono text-sm text-slate-800 break-all select-all">{generatedKey}</span>
                    ) : (
                      <span className="font-mono text-lg text-slate-400 tracking-[0.15em]">••••••••••••••••••••••••••••••••</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 border-l border-slate-200 pl-2 shrink-0">
                    <button aria-label={keyRevealed ? "Hide secret key" : "Reveal secret key"} title={keyRevealed ? "Hide secret key" : "Reveal secret key"} onClick={() => setKeyRevealed(!keyRevealed)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      {keyRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button aria-label="Copy secret key" title="Copy secret key" onClick={handleCopyKey} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      {keyCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-xl border border-red-100">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                <p className="text-sm font-medium leading-relaxed">
                  This key will <strong>NOT</strong> be shown again. Share it securely with <strong>{keyNomineeName}</strong>.
                  All nominees must provide their keys together to unlock the vault after the trigger activates.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => { setKeyDialogOpen(false); setGeneratedKey(null); }}>
                I've Saved the Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!vaultId ? (
          <section className="card-enterprise"><PanelHeading title="Your trusted circle" description="Nominees and inheritance permissions" /><EmptyState icon={Users} title="Your trusted circle starts here" description="Connect a vault to view and manage its nominees." /></section>
        ) : (
          <>
            {/* Table */}
            <div className="card-enterprise overflow-hidden">
              <PanelHeading title="Your trusted circle" description="Nominees and inheritance permissions" />
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground">Nominee Name</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Verification</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Legal Approval</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Trigger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : nominees.length > 0 ? (
                    nominees.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-medium text-sm text-foreground flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{n.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{n.email}</TableCell>
                        <TableCell><span className="badge-encrypted"><Shield className="h-3 w-3" />{n.verification_level}</span></TableCell>
                        <TableCell>
                          <span className={n.legal_approval === "Approved" ? "badge-success" : n.legal_approval === "Pending Review" ? "badge-warning" : "badge-encrypted"}>
                            {n.legal_approval === "Approved" && <CheckCircle2 className="h-3 w-3" />}
                            {n.legal_approval === "Pending Review" && <Clock className="h-3 w-3" />}
                            {n.legal_approval === "Under Review" && <AlertTriangle className="h-3 w-3" />}
                            {n.legal_approval || "Pending"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{n.trigger_condition}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                        No nominees added yet. Click "Add Nominee" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Approval Chain */}
              <div className="card-enterprise p-6">
                <h3 className="section-title mb-2">Approval workflow</h3>
                <p className="text-xs text-muted-foreground mb-6">Reference stages, not a live approval status</p>
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
                <h3 className="section-title mb-2">Inactivity timeline</h3>
                <p className="text-xs text-muted-foreground mb-6">Example 180-day schedule</p>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
