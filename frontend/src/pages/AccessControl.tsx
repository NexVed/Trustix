import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Crown, Scale, Eye, User, UserPlus } from "lucide-react";

const roles = [
  { name: "Super Admin", icon: Crown, description: "Full platform access", users: 2, color: "bg-primary/10 text-primary" },
  { name: "Legal Officer", icon: Scale, description: "Document & compliance access", users: 5, color: "bg-success/10 text-success" },
  { name: "Auditor", icon: Eye, description: "Read-only audit access", users: 3, color: "bg-warning/10 text-warning" },
  { name: "Client", icon: User, description: "Limited self-service access", users: 12, color: "bg-info/10 text-info" },
];

const permissions = [
  "View Assets", "Edit Assets", "Delete Assets", "Manage Nominees",
  "Approve Documents", "View Audit Logs", "Manage Users", "Blockchain Operations",
  "Export Data", "Organization Settings",
];

const matrix: Record<string, boolean[]> = {
  "Super Admin": [true, true, true, true, true, true, true, true, true, true],
  "Legal Officer": [true, true, false, true, true, true, false, false, true, false],
  "Auditor": [true, false, false, false, false, true, false, false, true, false],
  "Client": [true, false, false, false, false, false, false, false, false, false],
};

export default function AccessControl() {
  const [perms, setPerms] = useState(matrix);

  const toggle = (role: string, idx: number) => {
    setPerms((prev) => ({
      ...prev,
      [role]: prev[role].map((v, i) => (i === idx ? !v : v)),
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Access Control</h1>
            <p className="page-subtitle">Enterprise role-based access management</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2"><UserPlus className="h-4 w-4" />Invite Team Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>Send an invitation to join the organization.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Email Address</Label><Input type="email" placeholder="colleague@company.com" /></div>
                <div className="space-y-2"><Label>Role</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent><SelectItem value="admin">Super Admin</SelectItem><SelectItem value="legal">Legal Officer</SelectItem><SelectItem value="auditor">Auditor</SelectItem><SelectItem value="client">Client</SelectItem></SelectContent></Select>
                </div>
              </div>
              <DialogFooter><Button>Send Invitation</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r) => (
            <div key={r.name} className="card-enterprise p-5">
              <div className={`h-10 w-10 rounded-xl ${r.color} flex items-center justify-center mb-3`}>
                <r.icon className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">{r.name}</h4>
              <p className="text-xs text-muted-foreground mb-2">{r.description}</p>
              <span className="text-xs font-medium text-muted-foreground">{r.users} users</span>
            </div>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div className="card-enterprise overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="section-title">Permissions Matrix</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Permission</TableHead>
                {roles.map((r) => (
                  <TableHead key={r.name} className="text-xs font-semibold text-muted-foreground text-center">{r.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm, pi) => (
                <TableRow key={perm}>
                  <TableCell className="text-sm text-foreground">{perm}</TableCell>
                  {roles.map((r) => (
                    <TableCell key={r.name} className="text-center">
                      <Switch checked={perms[r.name][pi]} onCheckedChange={() => toggle(r.name, pi)} />
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
