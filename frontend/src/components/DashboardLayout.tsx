"use client";

import { useState } from "react";
import Link from "next/link";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, dashboardNavigation } from "@/components/AppSidebar";
import { Search, Settings, ArrowUpRight, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Your workspace";
  const results = dashboardNavigation.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <SidebarProvider className="tx-shell" style={{ "--sidebar-width": "216px", "--sidebar-width-icon": "64px" } as React.CSSProperties}>
      <AppSidebar />
      <div className="tx-workspace">
        <header className="tx-topbar">
          <div className="tx-topbar-left">
            <SidebarTrigger title="Toggle navigation" className="tx-mobile-trigger" />
            <div className="tx-search-wrap">
              <label className="tx-search"><Search size={16} /><input aria-label="Search workspace" placeholder="Search your workspace..." value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyDown={e => { if (e.key === "Escape") { setFocused(false); setQuery(""); } }} /></label>
              {focused && query && <div className="tx-search-results">
                {results.length ? results.map(item => <Link onMouseDown={e => e.preventDefault()} key={item.url} href={item.url} onClick={() => { setQuery(""); setFocused(false); }}><item.icon size={16} />{item.title}<ArrowUpRight size={14} /></Link>) : <p>No matching pages</p>}
              </div>}
            </div>
          </div>
          <div className="tx-topbar-right">
            <span className="tx-private"><ShieldDot /> Private workspace</span>
            <Link className="tx-icon-button" href="/settings" title="Workspace settings" aria-label="Workspace settings"><Settings size={17} /></Link>
            <Popover>
              <PopoverTrigger asChild><button className="tx-profile"><span className="tx-avatar">{name.slice(0, 2).toUpperCase()}</span><span><strong>{name}</strong><small>{user?.email || "Personal account"}</small></span><ChevronDown size={14} /></button></PopoverTrigger>
              <PopoverContent align="end" className="tx-account-menu">
                <Link href="/settings"><Settings size={16} /> Account settings</Link>
                <button onClick={async () => { await signOut(); router.push("/"); }}><LogOut size={16} />{user ? "Sign out" : "Leave preview"}</button>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <main className="tx-main">{children}</main>
      </div>
    </SidebarProvider>
  );
}

function ShieldDot() { return <span className="tx-status-dot" />; }
