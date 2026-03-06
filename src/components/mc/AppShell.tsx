import Link from "next/link";
import type { ReactNode } from "react";
import { navTabs } from "@/lib/navigation";

type AppShellProps = {
  activeTab: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightRail?: ReactNode;
};

function DotIcon() {
  return <span className="mc-dot" aria-hidden="true" />;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mc-panel ${className}`}>{children}</section>;
}

export function AppShell({ activeTab, title, subtitle, children, rightRail }: AppShellProps) {
  return (
    <div className="mc-root">
      <div className="mc-bg" aria-hidden="true" />
      <aside className="mc-sidebar">
        <div className="mc-brand">
          <div className="mc-brand-mark">G</div>
          <div>
            <p className="mc-brand-title">Mission Control</p>
            <p className="mc-brand-subtitle">Giuseppe</p>
          </div>
        </div>

        <nav className="mc-nav" aria-label="Primary">
          {navTabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Link key={tab.key} href={tab.href} className={`mc-nav-item ${isActive ? "is-active" : ""}`}>
                <span className="mc-nav-left">
                  <DotIcon />
                  <span>{tab.label}</span>
                </span>
                {tab.count ? <span className="mc-nav-count">{tab.count}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mc-sidebar-footer">
          <p>Agents online</p>
          <div className="mc-agent-stack">
            <span>Giuseppe</span>
            <span>Builder</span>
            <span>Sentry</span>
            <span>Cisco</span>
          </div>
        </div>
      </aside>

      <main className="mc-main">
        <header className="mc-topbar">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="mc-topbar-actions">
            <button className="mc-btn mc-btn-ghost">Search</button>
            <button className="mc-btn mc-btn-primary">+ New</button>
          </div>
        </header>

        <div className={`mc-content ${rightRail ? "with-rail" : ""}`}>
          <div className="mc-content-main">{children}</div>
          {rightRail ? <aside className="mc-content-rail">{rightRail}</aside> : null}
        </div>
      </main>
    </div>
  );
}
