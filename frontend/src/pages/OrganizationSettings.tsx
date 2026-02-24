import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Settings {
  org_name: string;
  org_registration: string;
  org_address: string;
  org_jurisdiction: string;
  primary_contact: string;
  contact_email: string;
  encryption_standard: string;
  key_derivation: string;
  key_rotation_days: number;
  primary_region: string;
  backup_region: string;
  gdpr_enabled: boolean;
  retention_policy: string;
  legal_tos: string;
  legal_inheritance: string;
}

const defaults: Settings = {
  org_name: "",
  org_registration: "",
  org_address: "",
  org_jurisdiction: "",
  primary_contact: "",
  contact_email: "",
  encryption_standard: "aes256",
  key_derivation: "argon2",
  key_rotation_days: 90,
  primary_region: "us-east",
  backup_region: "eu-west",
  gdpr_enabled: true,
  retention_policy: "7years",
  legal_tos: "",
  legal_inheritance: "",
};

export default function OrganizationSettings() {
  const { session, user } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const authToken = session?.access_token;
        if (!authToken) return;

        const response = await fetch(`${API_URL}/settings`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({
            ...prev,
            ...Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)),
          }));
        }
      } catch { }
      finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [session?.access_token]);

  // Auto-fill contact email from user if empty
  useEffect(() => {
    if (!settings.contact_email && user?.email) {
      setSettings((prev) => ({ ...prev, contact_email: user.email! }));
    }
  }, [user?.email, settings.contact_email]);

  const update = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const authToken = session?.access_token;
      const response = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        toast({ title: "Settings Saved", description: "Your organization settings have been updated." });
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast({ title: "Save Failed", description: "Could not save settings.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error saving settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [settings, session?.access_token]);

  const SaveButton = () => (
    <Button onClick={handleSave} disabled={saving} className="gap-2">
      {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : saved ? <><CheckCircle2 className="h-4 w-4" />Saved</> : "Save Changes"}
    </Button>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Organization Settings</h1>
          <p className="page-subtitle">Configure your organization, encryption, and compliance settings</p>
        </div>

        <Tabs defaultValue="org" className="space-y-6">
          <TabsList>
            <TabsTrigger value="org">Organization</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
            <TabsTrigger value="encryption">Encryption</TabsTrigger>
            <TabsTrigger value="keys">Key Management</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
          </TabsList>

          <TabsContent value="org">
            <div className="card-enterprise p-6 space-y-6">
              <h3 className="section-title">Organization Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Organization Name</Label><Input value={settings.org_name} onChange={(e) => update("org_name", e.target.value)} placeholder="Your organization name" /></div>
                <div className="space-y-2"><Label>Registration Number</Label><Input value={settings.org_registration} onChange={(e) => update("org_registration", e.target.value)} placeholder="e.g. MCG-2024-NY-0847" /></div>
                <div className="space-y-2"><Label>Primary Address</Label><Input value={settings.org_address} onChange={(e) => update("org_address", e.target.value)} placeholder="Organization address" /></div>
                <div className="space-y-2"><Label>Jurisdiction</Label><Input value={settings.org_jurisdiction} onChange={(e) => update("org_jurisdiction", e.target.value)} placeholder="e.g. New York, United States" /></div>
                <div className="space-y-2"><Label>Primary Contact</Label><Input value={settings.primary_contact} onChange={(e) => update("primary_contact", e.target.value)} placeholder="Name — Title" /></div>
                <div className="space-y-2"><Label>Contact Email</Label><Input value={settings.contact_email} onChange={(e) => update("contact_email", e.target.value)} type="email" placeholder="contact@org.com" /></div>
              </div>
              <SaveButton />
            </div>
          </TabsContent>

          <TabsContent value="legal">
            <div className="card-enterprise p-6 space-y-6">
              <h3 className="section-title">Legal Disclaimers</h3>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Terms of Service Disclaimer</Label><Textarea rows={4} value={settings.legal_tos} onChange={(e) => update("legal_tos", e.target.value)} placeholder="Enter your organization's Terms of Service disclaimer..." /></div>
                <div className="space-y-2"><Label>Inheritance Disclaimer</Label><Textarea rows={4} value={settings.legal_inheritance} onChange={(e) => update("legal_inheritance", e.target.value)} placeholder="Enter your inheritance trigger disclaimer..." /></div>
              </div>
              <SaveButton />
            </div>
          </TabsContent>

          <TabsContent value="encryption">
            <div className="card-enterprise p-6 space-y-6">
              <h3 className="section-title">Encryption Policies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Encryption Standard</Label>
                  <Select value={settings.encryption_standard} onValueChange={(v) => update("encryption_standard", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aes256">AES-256-GCM</SelectItem>
                      <SelectItem value="aes128">AES-128-GCM</SelectItem>
                      <SelectItem value="chacha">ChaCha20-Poly1305</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Key Derivation</Label>
                  <Select value={settings.key_derivation} onValueChange={(v) => update("key_derivation", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="argon2">Argon2id</SelectItem>
                      <SelectItem value="pbkdf2">PBKDF2</SelectItem>
                      <SelectItem value="scrypt">scrypt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SaveButton />
            </div>
          </TabsContent>

          <TabsContent value="keys">
            <div className="card-enterprise p-6 space-y-6">
              <h3 className="section-title">Key Management Policy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Key Rotation Schedule</Label>
                  <Select value={String(settings.key_rotation_days)} onValueChange={(v) => update("key_rotation_days", parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Every 30 days</SelectItem>
                      <SelectItem value="90">Every 90 days</SelectItem>
                      <SelectItem value="180">Every 180 days</SelectItem>
                      <SelectItem value="365">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SaveButton />
            </div>
          </TabsContent>

          <TabsContent value="storage">
            <div className="card-enterprise p-6 space-y-6">
              <h3 className="section-title">Data Storage Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Primary Region</Label>
                  <Select value={settings.primary_region} onValueChange={(v) => update("primary_region", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east">US East (N. Virginia)</SelectItem>
                      <SelectItem value="eu-west">EU West (Ireland)</SelectItem>
                      <SelectItem value="ap-south">AP South (Mumbai)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Backup Region</Label>
                  <Select value={settings.backup_region} onValueChange={(v) => update("backup_region", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-west">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west">EU West (Ireland)</SelectItem>
                      <SelectItem value="ap-north">AP Northeast (Tokyo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SaveButton />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
