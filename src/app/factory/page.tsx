import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function FactoryPage() {
  return (
    <AppShell activeTab="factory">
      <PlaceholderTabScreen title="Factory" />
    </AppShell>
  );
}
