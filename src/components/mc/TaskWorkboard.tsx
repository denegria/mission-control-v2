import Link from "next/link";
import type { Project, Settings, TaskStatus } from "@/domain/schema";
import type { TaskWorkboardItem } from "@/domain/tasks";
import { Panel } from "@/components/mc/AppShell";
import type { ActorOption } from "@/lib/actors";
import { getActorLabel } from "@/lib/actors";

const WORKBOARD_COLUMNS: Array<{ status: TaskStatus; label: string }> = [
  { status: "drafted", label: "Drafted" },
  { status: "ready", label: "Ready" },
  { status: "active", label: "Active" },
  { status: "blocked", label: "Blocked" },
  { status: "in_review", label: "In Review" },
  { status: "needs_approval", label: "Needs Approval" },
  { status: "completed", label: "Completed" },
];

function toPrettyStatus(status: string) {
  return status.replaceAll("_", " ");
}

function relativeDate(iso: string) {
  const deltaMs = Date.now() - Date.parse(iso);
  const hours = Math.max(1, Math.floor(deltaMs / (1000 * 60 * 60)));
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function TaskWorkboard({
  tasks,
  filters,
  projects,
  actorOptions,
  defaultOperatorId,
  settings,
  onCreateTask,
}: {
  tasks: TaskWorkboardItem[];
  filters: { owner?: string; status?: string; projectId?: string };
  projects: Project[];
  actorOptions: ActorOption[];
  defaultOperatorId: string;
  settings: Settings | null;
  onCreateTask: (formData: FormData) => void | Promise<void>;
}) {
  const byStatus = new Map<TaskStatus, TaskWorkboardItem[]>();
  for (const column of WORKBOARD_COLUMNS) {
    byStatus.set(column.status, []);
  }
  for (const task of tasks) {
    if (!byStatus.has(task.status)) {
      byStatus.set(task.status, []);
    }
    byStatus.get(task.status)?.push(task);
  }

  const needsApproval = tasks.filter((task) => task.pendingApprovals > 0).length;
  const blocked = tasks.filter((task) => task.blockedFlows > 0 || task.status === "blocked").length;
  const active = tasks.filter((task) => task.status === "active" || task.status === "in_review").length;

  return (
    <>
      <div className="mc-stats-row">
        <div className="mc-stat">
          <strong className="tone-white">{tasks.length}</strong>
          <span>Total tasks</span>
        </div>
        <div className="mc-stat">
          <strong className="tone-blue">{active}</strong>
          <span>Active + Review</span>
        </div>
        <div className="mc-stat">
          <strong className="tone-green">{blocked}</strong>
          <span>Blocked</span>
        </div>
        <div className="mc-stat">
          <strong className="tone-purple">{needsApproval}</strong>
          <span>Needs approval</span>
        </div>
      </div>

      <div className="mc-toolbar-row mc-toolbar-wrap">
        <form action={onCreateTask} className="mc-inline-form">
          <input type="text" name="title" placeholder="Task title" required className="mc-inline-input" />
          <input type="text" name="objective" placeholder="Objective" required className="mc-inline-input" />
          <select name="owner" className="mc-filter-select" defaultValue={defaultOperatorId}>
            {actorOptions.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.label}
              </option>
            ))}
          </select>
          <button className="mc-primary" type="submit">
            + New task
          </button>
        </form>

        <form action="/tasks" className="mc-inline-form">
          <select name="status" className="mc-filter-select" defaultValue={filters.status ?? ""}>
            <option value="">All statuses</option>
            {WORKBOARD_COLUMNS.map((column) => (
              <option key={column.status} value={column.status}>
                {column.label}
              </option>
            ))}
          </select>
          <select name="owner" className="mc-filter-select" defaultValue={filters.owner ?? ""}>
            <option value="">All owners</option>
            {actorOptions.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.label}
              </option>
            ))}
          </select>
          <select name="projectId" className="mc-filter-select" defaultValue={filters.projectId ?? ""}>
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button className="mc-filter-pill" type="submit">
            Apply filters
          </button>
          <Link href="/tasks" className="mc-filter-pill">
            Reset
          </Link>
        </form>

        <div className="mc-toolbar-row mc-toolbar-inline-summary">
          <span className="mc-filter-pill">{filters.status ? `Status: ${toPrettyStatus(filters.status)}` : "Status: all"}</span>
          <span className="mc-filter-pill">{filters.owner ? `Owner: ${getActorLabel(filters.owner, settings)}` : "Owner: all"}</span>
          <span className="mc-filter-pill">
            {filters.projectId
              ? `Project: ${projects.find((project) => project.id === filters.projectId)?.name ?? filters.projectId}`
              : "Project: all"}
          </span>
        </div>
      </div>

      <div className="mc-board-grid">
        {WORKBOARD_COLUMNS.map((column) => {
          const items = byStatus.get(column.status) ?? [];
          return (
            <Panel key={column.status}>
              <h3 className="mc-col-title">{column.label}</h3>
              {items.length === 0 ? (
                <div className="mc-empty-col">No tasks</div>
              ) : (
                <div className="mc-task-stack">
                  {items.map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`} className="mc-task-card mc-task-link">
                      <h4>{task.title}</h4>
                      <p>
                        {getActorLabel(task.owner, settings)} • {toPrettyStatus(task.priority)} priority
                      </p>
                      <p>
                        {task.flowCount} flows • {task.pendingApprovals} pending approvals
                      </p>
                      <p>Updated {relativeDate(task.updatedAt)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          );
        })}

        <Panel>
          <h3 className="mc-col-title">Workboard Notes</h3>
          <ul className="mc-activity-feed">
            <li>Task is the canonical object.</li>
            <li>Flow is the executable stream.</li>
            <li>Approvals are risk-gated checkpoints.</li>
            <li>Timeline reflects the append-only event log.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
