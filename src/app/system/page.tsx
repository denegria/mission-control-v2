import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function SystemPage() {
  return (
    <AppShell activeTab="system">
      <PlaceholderTabScreen title="System" />
    </AppShell>
  );
}
