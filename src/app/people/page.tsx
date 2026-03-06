import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function PeoplePage() {
  return (
    <AppShell activeTab="people">
      <PlaceholderTabScreen title="People" />
    </AppShell>
  );
}
