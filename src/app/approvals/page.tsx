import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function ApprovalsPage() {
  return (
    <AppShell activeTab="approvals">
      <PlaceholderTabScreen title="Approvals" />
    </AppShell>
  );
}
