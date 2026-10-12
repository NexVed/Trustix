"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Vault, ShieldCheck, Users, ScanSearch, Activity, Link2, Settings, FileCheck, ShieldAlert, BarChart3, ChevronsLeft, ChevronsRight, LockKeyhole } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";

export const dashboardNavigation = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Asset vault", url: "/asset-vault", icon: Vault },
  { title: "Trusted nominees", url: "/nominee-governance", icon: Users },
  { title: "Document verification", url: "/ai-verification", icon: ScanSearch },
  { title: "Activity ledger", url: "/activity-ledger", icon: Activity },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Private vault", url: "/zk-vault", icon: LockKeyhole },
  { title: "Access control", url: "/access-control", icon: ShieldCheck },
  { title: "Notarization", url: "/blockchain", icon: Link2 },
  { title: "Risk monitoring", url: "/risk-monitoring", icon: ShieldAlert },
  { title: "Compliance & audit", url: "/compliance", icon: FileCheck },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar, setOpenMobile, isMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="tx-sidebar">
      <SidebarHeader className="tx-brand">
        <Link href="/dashboard" aria-label="Trustix overview" onClick={() => setOpenMobile(false)}>
          <img src="/trustixlogo.png" width="30" height="34" alt="" />
          {!collapsed && <img src="/trustixname.png" width="110" height="23" alt="Trustix" />}
        </Link>
      </SidebarHeader>
      <SidebarContent className="tx-nav">
        {[dashboardNavigation.slice(0, 6), dashboardNavigation.slice(6, 11)].map((group, index) => (
          <div key={index} className="tx-nav-section">
            {!collapsed && <p className="tx-nav-label">{index === 0 ? "WORKSPACE" : "PROTECTION"}</p>}
            <SidebarMenu>
              {group.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                    <Link href={item.url} onClick={() => setOpenMobile(false)} aria-current={pathname === item.url ? "page" : undefined}>
                      <item.icon size={17} /><span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="tx-nav-footer">
        <SidebarMenuButton asChild tooltip="Settings">
          <Link href="/settings" onClick={() => setOpenMobile(false)}><Settings size={17} /><span>Settings</span></Link>
        </SidebarMenuButton>
        <SidebarMenuButton onClick={toggleSidebar} tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}<span>{isMobile ? "Close menu" : collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
