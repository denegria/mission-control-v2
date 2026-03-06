import { AppShell, Panel } from "@/components/mc/AppShell";

export default function SettingsPage() {
  return (
    <AppShell activeTab="settings" title="Settings" subtitle="Workspace and visual controls">
      <div className="mc-grid-cols-3">
        <Panel>
          <h3>Theme</h3>
          <p className="mc-muted">Dark · Linear-inspired</p>
        </Panel>
        <Panel>
          <h3>Identity</h3>
          <p className="mc-muted">Primary persona: Giuseppe</p>
        </Panel>
        <Panel>
          <h3>Navigation</h3>
          <p className="mc-muted">All left-bar tabs enabled</p>
        </Panel>
      </div>
    </AppShell>
  );
}
