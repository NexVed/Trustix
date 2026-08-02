import { useMemo, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronDown,
  CircleHelp,
  FileCheck,
  LayoutDashboard,
  Link2,
  LogOut,
  ScanSearch,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  Vault,
} from "lucide-react";
import "./AppSidebar.css";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
};

const navigationGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
      { title: "Asset Vault", url: "/asset-vault", icon: Vault },
      { title: "ZK Vault", url: "/zk-vault", icon: ShieldAlert },
      { title: "Document Verification", url: "/ai-verification", icon: ScanSearch },
      { title: "Nominees", url: "/nominee-governance", icon: Users },
      { title: "Notarization", url: "/blockchain", icon: Link2 },
    ],
  },
  {
    label: "Security",
    items: [
      { title: "Access Control", url: "/access-control", icon: ShieldCheck },
      { title: "Compliance & Audit", url: "/compliance", icon: FileCheck },
      { title: "Activity Ledger", url: "/activity-ledger", icon: Activity },
      { title: "Risk Monitoring", url: "/risk-monitoring", icon: AlertTriangle },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
];

const workspaces = [
  { name: "Meridian Capital", plan: "Enterprise workspace", initials: "MC", tone: "mint" },
  { name: "Family Vault", plan: "Personal workspace", initials: "FV", tone: "blue" },
  { name: "Trustix Demo", plan: "Preview workspace", initials: "TD", tone: "violet" },
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
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [workspace, setWorkspace] = useState(workspaces[0]);

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Dashboard Preview";
  const email = user?.email || "preview@trustix.app";
  const initials = getInitials(fullName, email);

  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return navigationGroups;

    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.title.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="app-sidebar border-r border-sidebar-border">
      <SidebarHeader className="app-sidebar-header">
        <div className="app-brand-row">
          <img src="/trustixlogo.png" alt="Trustix" className="app-brand-mark" />
          <div className="app-brand-copy">
            <img src="/trustixname.png" alt="Trustix" className="app-brand-name" />
            <span>Secure workspace</span>
          </div>
        </div>

        {!collapsed && (
          <div className="app-workspace-wrap">
            <button
              type="button"
              className="app-workspace-switcher"
              onClick={() => setWorkspaceOpen((open) => !open)}
              aria-expanded={workspaceOpen}
            >
              <span className={`app-workspace-avatar ${workspace.tone}`}>{workspace.initials}</span>
              <span className="app-workspace-text">
                <strong>{workspace.name}</strong>
                <small>{workspace.plan}</small>
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {workspaceOpen && (
              <div className="app-workspace-popover">
                {workspaces.map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    className={`app-workspace-option ${item.name === workspace.name ? "is-selected" : ""}`}
                    onClick={() => {
                      setWorkspace(item);
                      setWorkspaceOpen(false);
                    }}
                  >
                    <span className={`app-workspace-avatar ${item.tone}`}>{item.initials}</span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.plan}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="app-sidebar-content">
        {!collapsed && (
          <label className="app-sidebar-search">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search navigation"
              aria-label="Search navigation"
            />
          </label>
        )}

        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label} className="app-nav-group">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="app-nav-link"
                        activeClassName="is-active"
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
        ))}
      </SidebarContent>

      <SidebarFooter className="app-sidebar-footer">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <NavLink to="/settings" className="app-nav-link" activeClassName="is-active">
                <Settings className="h-4 w-4 shrink-0" />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="app-nav-link" tooltip="Help & support">
              <CircleHelp className="h-4 w-4 shrink-0" />
              <span>Help & support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="app-account-wrap">
          {!collapsed && accountOpen && (
            <div className="app-account-popover">
              <div className="app-account-summary">
                <span className="app-account-avatar">{initials}</span>
                <span>
                  <strong>{fullName}</strong>
                  <small>{email}</small>
                </span>
              </div>
              <button type="button" onClick={handleSignOut} className="app-account-action">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
          <button
            type="button"
            className="app-account-trigger"
            onClick={() => setAccountOpen((open) => !open)}
            aria-expanded={accountOpen}
          >
            <span className="app-account-avatar">{initials}</span>
            <span className="app-account-text">
              <strong>{fullName}</strong>
              <small>{email}</small>
            </span>
            {!collapsed && <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}