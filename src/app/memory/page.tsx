import { AppShell, Panel } from "@/components/mc/AppShell";

const notes = [
  "2026-03-06 · v2 baseline locked",
  "Auth QA browser stack stable",
  "Calendly-first funnel remains active",
  "Remember: no fake progress reports",
];

export default function MemoryPage() {
  return (
    <AppShell activeTab="memory" title="Memory" subtitle="Institutional context and durable decisions">
      <div className="mc-memory-layout">
        <Panel>
          <div className="mc-panel-title-row">
            <h3>Notes</h3>
            <span>{notes.length}</span>
          </div>
          <ul className="mc-activity-list">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <div className="mc-panel-title-row">
            <h3>Selected Entry</h3>
            <span>Giuseppe</span>
          </div>
          <p className="mc-muted">
            Mission Control v2 is isolated in a dedicated Next.js project. Shell parity is in-progress and routes are mapped.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
