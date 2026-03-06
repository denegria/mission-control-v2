import { AppShell } from "@/components/mc/AppShell";
import { DocsScreen } from "@/components/mc/ReferenceScreens";

export default function DocsPage() {
  return (
    <AppShell activeTab="docs">
      <DocsScreen />
    </AppShell>
  );
}
