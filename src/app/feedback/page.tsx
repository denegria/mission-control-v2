import { AppShell } from "@/components/mc/AppShell";
import { PlaceholderTabScreen } from "@/components/mc/ReferenceScreens";

export default function FeedbackPage() {
  return (
    <AppShell activeTab="feedback">
      <PlaceholderTabScreen title="Feedback" />
    </AppShell>
  );
}
