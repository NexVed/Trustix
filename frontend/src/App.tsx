import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import ZkVaultPage from "./pages/ZkVaultPage";

// New Trustix UI Components
import TrustixLanding from "@/components/trustix-vault/TrustixLanding";
import NomineeGeneration from "@/components/trustix-vault/NomineeGeneration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />

            {/* New Trustix Pages */}
            <Route path="/trustix-landing" element={<TrustixLanding />} />
            <Route path="/nominee-generation" element={<ProtectedRoute><NomineeGeneration /></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/asset-vault" element={<ProtectedRoute><AssetVault /></ProtectedRoute>} />
            <Route path="/zk-vault" element={<ProtectedRoute><ZkVaultPage /></ProtectedRoute>} />
            <Route path="/ai-verification" element={<ProtectedRoute><AIVerification /></ProtectedRoute>} />
            <Route path="/nominee-governance" element={<ProtectedRoute><NomineeGovernance /></ProtectedRoute>} />
            <Route path="/blockchain" element={<ProtectedRoute><BlockchainNotarization /></ProtectedRoute>} />
            <Route path="/access-control" element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><ComplianceAudit /></ProtectedRoute>} />
            <Route path="/activity-ledger" element={<ProtectedRoute><ActivityLedger /></ProtectedRoute>} />
            <Route path="/risk-monitoring" element={<ProtectedRoute><RiskMonitoring /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><OrganizationSettings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
