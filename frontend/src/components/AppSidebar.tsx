import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Vault,
  ScanSearch,
  Users,
  Link2,
  ShieldCheck,
  FileCheck,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
  Building2,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";

const mainNavItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Asset Vault", url: "/asset-vault", icon: Vault },
  { title: "ZK Vault", url: "/zk-vault", icon: ShieldAlert },
  { title: "AI Document Verification", url: "/ai-verification", icon: ScanSearch },
  { title: "Nominee Governance", url: "/nominee-governance", icon: Users },
  { title: "Blockchain Notarization", url: "/blockchain", icon: Link2 },
];

const securityNavItems = [
  { title: "Access Control", url: "/access-control", icon: ShieldCheck },
  { title: "Compliance & Audit", url: "/compliance", icon: FileCheck },
  { title: "Activity Ledger", url: "/activity-ledger", icon: Activity },
  { title: "Risk Monitoring", url: "/risk-monitoring", icon: AlertTriangle },
];

const utilityNavItems = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Organization Settings", url: "/settings", icon: Settings },
];

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "User";
  const email = user?.email || "";
  const initials = getInitials(fullName, email);

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center">
                <img src="/logo.png" alt="Trustix Logo" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">TRUSTIX</h2>
                <p className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">Enterprise</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 text-xs hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-sidebar-accent-foreground">Meridian Capital Group</span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2 px-1">
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-[10px] font-medium text-muted-foreground">Super Admin</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-8 w-8 flex items-center justify-center">
              <img src="/logo.png" alt="Trustix Logo" className="h-8 w-8 object-contain" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground px-3 mb-1">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground px-3 mb-1">
            Security
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {securityNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground px-3 mb-1">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {utilityNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{fullName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{email}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
