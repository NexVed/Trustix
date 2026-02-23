import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OrganizationSettings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Organization Settings</h1>
          <p className="page-subtitle">Configure enterprise policies, encryption, and compliance settings</p>
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
                <div className="space-y-2"><Label>Organization Name</Label><Input defaultValue="Meridian Capital Group" /></div>
                <div className="space-y-2"><Label>Registration Number</Label><Input defaultValue="MCG-2024-NY-0847" /></div>
                <div className="space-y-2"><Label>Primary Address</Label><Input defaultValue="432 Park Avenue, New York, NY 10022" /></div>
                <div className="space-y-2"><Label>Jurisdiction</Label><Input defaultValue="New York, United States" /></div>
                <div className="space-y-2"><Label>Primary Contact</Label><Input defaultValue="James Reynolds — CEO" /></div>
                <div className="space-y-2"><Label>Contact Email</Label><Input defaultValue="j.reynolds@meridian.com" /></div>
              </div>
              <Button>Save Changes</Button>
            </div>
          </TabsContent>

          <TabsContent value="legal">
            <div className="card-enterprise p-6 space-y-6">
              <h3 className="section-title">Legal Disclaimers</h3>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Terms of Service Disclaimer</Label><Textarea rows={4} defaultValue="All digital assets stored within the TRUSTIX Enterprise platform are subject to the terms and conditions agreed upon during account creation. Meridian Capital Group reserves the right to modify these terms with 30 days written notice." /></div>
                <div className="space-y-2"><Label>Inheritance Disclaimer</Label><Textarea rows={4} defaultValue="Digital inheritance triggers are executed in accordance with applicable state and federal laws. TRUSTIX does not provide legal advice. Users are advised to consult licensed attorneys for estate planning." /></div>
              </div>
              <Button>Save Changes</Button>
            </div>
          </TabsContent>

          <TabsContent value="encryption">
            <div className="card-enterprise p-6 space-y-6">
              <h3 className="section-title">Encryption Policies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Encryption Standard</Label>
                  <Select defaultValue="aes256"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aes256">AES-256-GCM</SelectItem><SelectItem value="aes128">AES-128-GCM</SelectItem><SelectItem value="chacha">ChaCha20-Poly1305</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Key Derivation</Label>
                  <Select defaultValue="argon2"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="argon2">Argon2id</SelectItem><SelectItem value="pbkdf2">PBKDF2</SelectItem><SelectItem value="scrypt">scrypt</SelectItem></SelectContent></Select>
                </div>
              </div>
              <Button>Save Changes</Button>
            </div>
          </TabsContent>

          <TabsContent value="keys">
            <div className="card-enterprise p-6 space-y-6">
              <h3 className="section-title">Key Management Policy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Key Rotation Schedule</Label>
                  <Select defaultValue="90"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">Every 30 days</SelectItem><SelectItem value="90">Every 90 days</SelectItem><SelectItem value="180">Every 180 days</SelectItem><SelectItem value="365">Annually</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>HSM Provider</Label>
                  <Select defaultValue="aws"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aws">AWS CloudHSM</SelectItem><SelectItem value="azure">Azure Dedicated HSM</SelectItem><SelectItem value="thales">Thales Luna</SelectItem></SelectContent></Select>
                </div>
              </div>
              <Button>Save Changes</Button>
            </div>
          </TabsContent>

          <TabsContent value="storage">
            <div className="card-enterprise p-6 space-y-6">
              <h3 className="section-title">Data Storage Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Primary Region</Label>
                  <Select defaultValue="us-east"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="us-east">US East (N. Virginia)</SelectItem><SelectItem value="eu-west">EU West (Ireland)</SelectItem><SelectItem value="ap-south">AP South (Mumbai)</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Backup Region</Label>
                  <Select defaultValue="eu-west"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="us-west">US West (Oregon)</SelectItem><SelectItem value="eu-west">EU West (Ireland)</SelectItem><SelectItem value="ap-north">AP Northeast (Tokyo)</SelectItem></SelectContent></Select>
                </div>
              </div>
              <Button>Save Changes</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
