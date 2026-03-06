import { AppShell } from "@/components/mc/AppShell";
import { CalendarScreen } from "@/components/mc/ReferenceScreens";

export default function CalendarPage() {
  return (
    <AppShell activeTab="calendar">
      <CalendarScreen />
    </AppShell>
  );
}
