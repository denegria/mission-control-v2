import { AppShell } from "@/components/mc/AppShell";
import { ProjectCards } from "@/components/mc/SampleBlocks";

export default function ProjectsPage() {
  return (
    <AppShell activeTab="projects" title="Projects" subtitle="Portfolio health and delivery pace">
      <ProjectCards />
    </AppShell>
  );
}
