import { AppShell } from "@/components/mc/AppShell";
import { RunConsole } from "@/components/mc/RunConsole";
import { getSettings, listRunConsoleItems } from "@/server/domain/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function RunsPage() {
  const settings = getSettings();
  const items = listRunConsoleItems();

  return (
    <AppShell activeTab="runs">
      <RunConsole items={items} settings={settings} />
    </AppShell>
  );
}
