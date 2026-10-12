import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, VaultNotice, PanelHeading } from "@/components/WorkspacePage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Crown, Scale, Eye, User, UserPlus, Loader2, Shield } from "lucide-react";
import { useVault } from "@/contexts/VaultContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const roleConfig = [
  { key: "owner", name: "Vault Owner", icon: Crown, description: "Full vault access & management", color: "bg-primary/10 text-primary" },
  { key: "nominee", name: "Nominee", icon: Scale, description: "View-only access on trigger activation", color: "bg-success/10 text-success" },
  { key: "auditor", name: "Auditor", icon: Eye, description: "Read-only audit & compliance access", color: "bg-warning/10 text-warning" },
  { key: "viewer", name: "Viewer", icon: User, description: "Limited read-only access", color: "bg-info/10 text-info" },
];

const allPermissions = [
  "View Assets", "Upload Documents", "Delete Assets", "Manage Nominees",
  "Approve Documents", "View Audit Logs", "Manage Vault Settings", "Blockchain Operations",
  "Export Data", "Trigger Dead-Man Switch",
];

const defaultMatrix: Record<string, boolean[]> = {
  owner: [true, true, true, true, true, true, true, true, true, true],
  nominee: [true, false, false, false, false, false, false, false, false, false],
  auditor: [true, false, false, false, false, true, false, false, true, false],
  viewer: [true, false, false, false, false, false, false, false, false, false],
};

export default function AccessControl() {
  const { vaultId, role } = useVault();
  const { session } = useAuth();
  const { toast } = useToast();

  const [perms, setPerms] = useState(defaultMatrix);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviting, setInviting] = useState(false);

  // In a full implementation, load permissions from the backend
  // For now, use vault role to determine which column is "you"

  const toggle = (roleKey: string, idx: number) => {
    if (role !== 'owner') {
      toast({ title: "Permission Denied", description: "Only vault owners can modify permissions.", variant: "destructive" });
      return;
    }
    setPerms((prev) => ({
      ...prev,
      [roleKey]: prev[roleKey].map((v, i) => (i === idx ? !v : v)),
    }));
    toast({ title: "Draft permission changed", description: "Preview only. Server permissions have not changed." });
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) return;
    setInviting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Log the invitation as an activity
      await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "Team Invitation Sent",
          entity: `${inviteEmail} — ${inviteRole}`,
          type: "Success",
          vault_id: vaultId,
        }),
      });
      toast({ title: "Invitation Sent", description: `Invite sent to ${inviteEmail} as ${inviteRole}.` });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("");
    } catch {
      toast({ title: "Error", description: "Failed to send invitation.", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="ws-page">
        <PageHeader section="Protection" title="Access control" description="A clear view of who can access your vault." actions={
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" disabled title="Team invitations are not connected yet"><UserPlus className="h-4 w-4" />Invite member</Button>
            </DialogTrigger>
            <DialogContent className="ws-dialog">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>Send an invitation to join this vault.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Email Address</Label><Input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{roleConfig.map(r => <SelectItem key={r.key} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail || !inviteRole}>
                  {inviting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />
        {!vaultId && <VaultNotice />}

        {/* Current Role Banner */}
        {vaultId && <div className="ws-notice">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Your role: <span className="text-primary capitalize">{role || 'Unknown'}</span></p>
              <p className="text-xs text-muted-foreground">Permissions are determined by your vault access level</p>
            </div>
          </div>
        </div>}

        {/* Role Cards */}
        <div className="ws-metrics">
          {roleConfig.map((r) => (
            <div key={r.key} className={`card-enterprise p-5 ${r.key === role ? 'ring-2 ring-primary' : ''}`}>
              <div className={`h-10 w-10 rounded-xl ${r.color} flex items-center justify-center mb-3`}>
                <r.icon className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">{r.name}</h4>
              <p className="text-xs text-muted-foreground mb-2">{r.description}</p>
              {r.key === role && <span className="text-[10px] font-medium text-primary">Your role</span>}
            </div>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div className="card-enterprise overflow-hidden">
          <PanelHeading title="Role permissions" description="Default permission template. Changes are local drafts, not enforced access rules." action={<span className="badge-encrypted">Preview</span>} />
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Permission</TableHead>
                {roleConfig.map((r) => (
                  <TableHead key={r.key} className="text-xs font-semibold text-muted-foreground text-center">{r.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPermissions.map((perm, pi) => (
                <TableRow key={perm}>
                  <TableCell className="text-sm text-foreground">{perm}</TableCell>
                  {roleConfig.map((r) => (
                    <TableCell key={r.key} className="text-center">
                      <Switch
                        aria-label={`${r.name}: ${perm}`}
                        checked={perms[r.key][pi]}
                        onCheckedChange={() => toggle(r.key, pi)}
                        disabled={role !== 'owner'}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
