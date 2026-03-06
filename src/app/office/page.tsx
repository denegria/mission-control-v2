import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function OfficePage() {
  return (
    <AppShell activeTab="office">
      <PlaceholderTabScreen title="Office" />
    </AppShell>
  );
}
