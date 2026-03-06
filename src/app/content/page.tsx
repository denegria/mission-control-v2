import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function ContentPage() {
  return (
    <AppShell activeTab="content">
      <PlaceholderTabScreen title="Content" />
    </AppShell>
  );
}
