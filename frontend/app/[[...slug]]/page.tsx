"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Providers } from "../providers";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingPage from "@/views/LandingPage";
import Auth from "@/views/Auth";
import Index from "@/views/Index";
import AssetVault from "@/views/AssetVault";
import ZkVaultPage from "@/views/ZkVaultPage";
import AIVerification from "@/views/AIVerification";
import NomineeGovernance from "@/views/NomineeGovernance";
import BlockchainNotarization from "@/views/BlockchainNotarization";
import AccessControl from "@/views/AccessControl";
import ComplianceAudit from "@/views/ComplianceAudit";
import ActivityLedger from "@/views/ActivityLedger";
import RiskMonitoring from "@/views/RiskMonitoring";
import Reports from "@/views/Reports";
import OrganizationSettings from "@/views/OrganizationSettings";
import TrustixLanding from "@/components/trustix-vault/TrustixLanding";
import NomineeGeneration from "@/components/trustix-vault/NomineeGeneration";
import NotFound from "@/views/NotFound";

const protectedPages: Record<string, React.ComponentType> = {
  "/asset-vault": AssetVault,
  "/zk-vault": ZkVaultPage,
  "/ai-verification": AIVerification,
  "/nominee-governance": NomineeGovernance,
  "/blockchain": BlockchainNotarization,
  "/access-control": AccessControl,
  "/compliance": ComplianceAudit,
  "/activity-ledger": ActivityLedger,
  "/risk-monitoring": RiskMonitoring,
  "/reports": Reports,
  "/settings": OrganizationSettings,
  "/nominee-generation": NomineeGeneration,
};

function RouteView() {
  const pathname = usePathname();
  const isDashboardPreview = process.env.NODE_ENV === "development";

  if (pathname === "/") return <LandingPage />;
  if (pathname === "/auth") {
    if (isDashboardPreview) return <PreviewRedirect />;
    return <Auth />;
  }
  if (pathname === "/trustix-landing") return <TrustixLanding />;
  if (pathname === "/dashboard") {
    return isDashboardPreview ? <Index /> : <ProtectedRoute><Index /></ProtectedRoute>;
  }

  const Page = protectedPages[pathname];
  if (!Page) return <NotFound />;
  // Keep the local design preview navigable; production routes remain protected.
  return isDashboardPreview && pathname !== "/nominee-generation"
    ? <Page />
    : <ProtectedRoute><Page /></ProtectedRoute>;
}

function PreviewRedirect() {
  const router = useRouter();
  useEffect(() => router.replace("/dashboard"), [router]);
  return null;
}

export default function Page() {
  return <Providers><RouteView /></Providers>;
}
