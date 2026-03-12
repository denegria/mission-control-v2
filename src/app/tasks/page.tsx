import { AppShell } from "@/components/mc/AppShell";
import { TaskWorkboard } from "@/components/mc/TaskWorkboard";
import { revalidatePath } from "next/cache";
import { createTask } from "@/server/domain/commands";
import { listProjects, listWorkboardTasks, getSettings } from "@/server/domain/repository";
import { getActorOptions, getDefaultOperatorId } from "@/lib/actors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; status?: string; projectId?: string }>;
}) {
  async function handleCreateTask(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const objective = String(formData.get("objective") ?? "").trim();
    const owner = String(formData.get("owner") ?? "").trim();
    if (!title || !objective || !owner) {
      return;
    }

    createTask({
      title,
      objective,
      owner,
      requester: defaultOperatorId,
    });
    revalidatePath("/tasks");
  }

  const filters = await searchParams;
  const settings = getSettings();
  const defaultOperatorId = getDefaultOperatorId(settings);
  const actorOptions = getActorOptions(settings);
  const tasks = listWorkboardTasks(filters);
  const projects = listProjects();
  return (
    <AppShell activeTab="tasks">
      <TaskWorkboard
        tasks={tasks}
        filters={filters}
        projects={projects}
        actorOptions={actorOptions}
        defaultOperatorId={defaultOperatorId}
        settings={settings}
        onCreateTask={handleCreateTask}
      />
    </AppShell>
  );
}
