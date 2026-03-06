import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function RadarPage() {
  return (
    <AppShell activeTab="radar">
      <PlaceholderTabScreen title="Radar" />
    </AppShell>
  );
}
