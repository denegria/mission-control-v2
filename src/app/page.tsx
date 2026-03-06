import { AppShell, Panel } from "@/components/mc/AppShell";
import { ProjectCards, TaskColumns, ActivityRail } from "@/components/mc/SampleBlocks";

export default function DashboardPage() {
  return (
    <AppShell
      activeTab="dashboard"
      title="Dashboard"
      subtitle="Linear-style baseline for Mission Control v2"
      rightRail={<ActivityRail />}
    >
      <Panel>
        <div className="mc-panel-title-row">
          <h3>Overview</h3>
          <span>Today</span>
        </div>
        <p className="mc-muted">
          System shell is live. Next phase: lock screenshot parity measurements and finish per-tab fidelity.
        </p>
      </Panel>
      <ProjectCards />
      <TaskColumns />
    </AppShell>
  );
}
