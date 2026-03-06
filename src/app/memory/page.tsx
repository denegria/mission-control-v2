import { AppShell } from "@/components/mc/AppShell";
import { MemoryScreen } from "@/components/mc/ReferenceScreens";

export default function MemoryPage() {
  return (
    <AppShell activeTab="memory">
      <MemoryScreen />
    </AppShell>
  );
}
