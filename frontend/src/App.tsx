import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AssetVault from "./pages/AssetVault";
import AIVerification from "./pages/AIVerification";
import NomineeGovernance from "./pages/NomineeGovernance";
import BlockchainNotarization from "./pages/BlockchainNotarization";
import AccessControl from "./pages/AccessControl";
import ComplianceAudit from "./pages/ComplianceAudit";
import ActivityLedger from "./pages/ActivityLedger";
import RiskMonitoring from "./pages/RiskMonitoring";
import Reports from "./pages/Reports";
import OrganizationSettings from "./pages/OrganizationSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/asset-vault" element={<AssetVault />} />
          <Route path="/ai-verification" element={<AIVerification />} />
          <Route path="/nominee-governance" element={<NomineeGovernance />} />
          <Route path="/blockchain" element={<BlockchainNotarization />} />
          <Route path="/access-control" element={<AccessControl />} />
          <Route path="/compliance" element={<ComplianceAudit />} />
          <Route path="/activity-ledger" element={<ActivityLedger />} />
          <Route path="/risk-monitoring" element={<RiskMonitoring />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<OrganizationSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
