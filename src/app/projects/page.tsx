import { AppShell } from "@/components/mc/AppShell";
import { Panel } from "@/components/mc/AppShell";
import { listProjects } from "@/server/domain/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = listProjects();
  return (
    <AppShell activeTab="projects">
      <div className="mc-heading-row">
        <div>
          <h2>Projects</h2>
          <p>{projects.length} total projects with repo + workload context</p>
        </div>
      </div>
      <div className="mc-project-grid">
        {projects.map((project) => (
          <Panel key={project.id}>
            <div className="mc-project-head">
              <h3>{project.name}</h3>
              <span className={`mc-status ${project.status}`}>{project.status}</span>
            </div>
            <p className="mc-proj-desc">Used for grouping, filtering, and future GitHub-aware defaults.</p>
            <div className="mc-project-meta">
              <span>{project.taskCount ?? 0} tasks</span>
              <span>{project.activeTaskCount ?? 0} active/review</span>
              <span>{project.pendingApprovalCount ?? 0} need approval</span>
            </div>
            <div className="mc-project-meta">
              <span>Repo: {project.githubRepo ?? "Not set"}</span>
              <span>Base: {project.githubDefaultBaseBranch ?? "main"}</span>
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
