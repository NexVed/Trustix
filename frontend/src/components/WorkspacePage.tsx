import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import Link from "next/link";

export function PageHeader({ title, description, section = "Workspace", actions }: {
  title: string; description: string; section?: string; actions?: ReactNode;
}) {
  return <header className="tx-page-heading">
    <div><div className="tx-eyebrow">{section} / {title}</div><h1>{title}<span className="tx-heading-dot">.</span></h1><p>{description}</p></div>
    {actions && <div className="tx-heading-actions">{actions}</div>}
  </header>;
}

export function MetricStrip({ items }: { items: { label: string; value: ReactNode; detail: string; icon: LucideIcon; tone?: "mint" | "cyan" | "navy" | "amber" }[] }) {
  return <div className="ws-metrics">{items.map(({ label, value, detail, icon: Icon, tone = "mint" }) =>
    <div className="ws-metric" key={label}><div className="ws-metric-top"><span>{label}</span><span className={`tx-small-icon ${tone}`}><Icon size={16} /></span></div><strong>{value}</strong><small>{detail}</small></div>
  )}</div>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return <div className="ws-empty"><span className="ws-empty-icon"><Icon size={26} strokeWidth={1.5} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function VaultNotice() {
  return <div className="ws-notice"><LockKeyhole size={17} /><span>No vault connected</span><Link href="/dashboard">Open a vault <ArrowUpRight size={14} /></Link></div>;
}

export function PanelHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="ws-panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}
