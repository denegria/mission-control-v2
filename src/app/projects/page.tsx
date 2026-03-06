import { AppShell } from "@/components/mc/AppShell";
import { ProjectsScreen } from "@/components/mc/ReferenceScreens";

export default function ProjectsPage() {
  return (
    <AppShell activeTab="projects">
      <ProjectsScreen />
    </AppShell>
  );
}
