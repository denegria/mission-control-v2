import { AppShell } from "@/components/mc/AppShell";
import { ActivityRail, TaskColumns } from "@/components/mc/SampleBlocks";

export default function TasksPage() {
  return (
    <AppShell
      activeTab="tasks"
      title="Tasks"
      subtitle="Kanban board aligned to Linear-style rhythm"
      rightRail={<ActivityRail />}
    >
      <TaskColumns />
    </AppShell>
  );
}
