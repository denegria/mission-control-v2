import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function CouncilPage() {
  return (
    <AppShell activeTab="council">
      <PlaceholderTabScreen title="Council" />
    </AppShell>
  );
}
