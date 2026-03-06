import Link from "next/link";
import type { ReactNode } from "react";
import { navTabs } from "@/lib/navigation";

type AppShellProps = {
  activeTab: string;
  children: ReactNode;
};

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mc-panel ${className}`}>{children}</section>;
}

export function AppShell({ activeTab, children }: AppShellProps) {
  return (
    <div className="mc-shell-wrap">
      <div className="mc-galaxy" aria-hidden="true" />
      <div className="mc-frame">
        <aside className="mc-sidebar">
          <div className="mc-brand">
            <span className="mc-brand-icons">◫ ✣</span>
            <span>Mission Control</span>
          </div>

          <nav className="mc-nav" aria-label="Mission Control sections">
            {navTabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Link key={tab.key} href={tab.href} className={`mc-nav-item ${isActive ? "is-active" : ""}`}>
                  <span className="mc-nav-icon" aria-hidden="true">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mc-sidebar-orb">G</div>
        </aside>

        <main className="mc-main">
          <header className="mc-topbar">
            <div className="mc-top-right">
              <button className="mc-search">⌕ Search ⌘K</button>
              <button className="mc-top-btn">⏸ Pause</button>
              <button className="mc-top-btn">Ping Giuseppe</button>
              <button className="mc-icon-btn">◉</button>
              <button className="mc-icon-btn">↻</button>
            </div>
          </header>

          <section className="mc-page">{children}</section>
        </main>
      </div>
    </div>
  );
}
