import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function AgentsPage() {
  return (
    <AppShell activeTab="agents">
      <PlaceholderTabScreen title="Agents" />
    </AppShell>
  );
}
