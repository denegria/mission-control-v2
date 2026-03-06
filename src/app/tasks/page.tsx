import { AppShell } from "@/components/mc/AppShell";
import { TasksScreen } from "@/components/mc/ReferenceScreens";

export default function TasksPage() {
  return (
    <AppShell activeTab="tasks">
      <TasksScreen />
    </AppShell>
  );
}
