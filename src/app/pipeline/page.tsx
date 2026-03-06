import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function PipelinePage() {
  return (
    <AppShell activeTab="pipeline">
      <PlaceholderTabScreen title="Pipeline" />
    </AppShell>
  );
}
