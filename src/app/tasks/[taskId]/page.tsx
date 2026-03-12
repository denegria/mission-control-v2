import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { AUTONOMY_SCOPES, FLOW_STATUSES, FLOW_TYPES, HANDOFF_STATUSES, PROTOCOL_MESSAGE_TYPES, PROTOCOL_STATUSES, RUN_ADAPTERS, TASK_STATUSES } from "@/domain/schema";
import { AppShell } from "@/components/mc/AppShell";
import { TaskDetailScreen } from "@/components/mc/TaskDetailScreen";
import {
  createFlow,
  emitProtocolMessage,
  createGithubIssueForWork,
  dispatchFlowRun,
  linkTaskLane,
  linkTaskGithubObject,
  linkFlowGithubObject,
  requestApproval,
  submitHandoff,
  updateHandoffStatus,
  updateProtocolMessageStatus,
  updateFlowOwner,
  updateFlowStatus,
  updateTaskOwner,
  updateTaskProject,
  updateTaskStatus,
} from "@/server/domain/commands";
import { getSettings, getTaskDetail, listProjects } from "@/server/domain/repository";
import { getActorOptions, getDefaultOperatorId } from "@/lib/actors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{
    githubIssueStatus?: string;
    githubIssueMessage?: string;
    dispatchStatus?: string;
    dispatchMessage?: string;
  }>;
}) {
  const { taskId } = await params;
  const statusParams = await searchParams;
  const settings = getSettings();
  const actorOptions = getActorOptions(settings);
  const actorId = getDefaultOperatorId(settings);

  async function handleTaskStatus(formData: FormData) {
    "use server";

    const status = String(formData.get("status") ?? "");
    if (!TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) {
      return;
    }
    updateTaskStatus({ taskId, status, actor: actorId });
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleTaskOwner(formData: FormData) {
    "use server";

    const owner = String(formData.get("owner") ?? "").trim();
    if (!owner) {
      return;
    }
    updateTaskOwner({ taskId, owner, actor: actorId });
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleCreateFlow(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const owner = String(formData.get("owner") ?? "").trim();
    const type = String(formData.get("type") ?? "");
    const objective = String(formData.get("objective") ?? "").trim();
    if (!title || !owner || !FLOW_TYPES.includes(type as (typeof FLOW_TYPES)[number])) {
      return;
    }

    createFlow({
      taskId,
      title,
      owner,
      type,
      objective,
      actor: actorId,
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleFlowStatus(formData: FormData) {
    "use server";

    const flowId = String(formData.get("flowId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    if (!flowId || !FLOW_STATUSES.includes(status as (typeof FLOW_STATUSES)[number])) {
      return;
    }

    updateFlowStatus({ flowId, status, actor: actorId });
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleFlowOwner(formData: FormData) {
    "use server";

    const flowId = String(formData.get("flowId") ?? "").trim();
    const owner = String(formData.get("owner") ?? "").trim();
    if (!flowId || !owner) {
      return;
    }

    updateFlowOwner({ flowId, owner, actor: actorId });
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleSubmitHandoff(formData: FormData) {
    "use server";

    const from = String(formData.get("from") ?? "").trim();
    const to = String(formData.get("to") ?? "").trim();
    const intent = String(formData.get("intent") ?? "").trim();
    const expectedOutput = String(formData.get("expectedOutput") ?? "").trim();
    const flowId = String(formData.get("flowId") ?? "").trim();
    const sourceFlowId = String(formData.get("sourceFlowId") ?? "").trim();
    const targetFlowId = String(formData.get("targetFlowId") ?? "").trim();
    if (!from || !to || !intent || !expectedOutput) {
      return;
    }

    submitHandoff({
      taskId,
      from,
      to,
      intent,
      expectedOutput,
      flowId: flowId || undefined,
      sourceFlowId: sourceFlowId || undefined,
      targetFlowId: targetFlowId || undefined,
      actor: actorId,
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleRequestApproval(formData: FormData) {
    "use server";

    const requestedAction = String(formData.get("requestedAction") ?? "").trim();
    const flowId = String(formData.get("flowId") ?? "").trim();
    const riskCategory = String(formData.get("riskCategory") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    if (!requestedAction || !riskCategory) {
      return;
    }

    requestApproval({
      taskId,
      flowId: flowId || undefined,
      requestedAction,
      riskCategory,
      summary,
      requestedBy: actorId,
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
    revalidatePath("/approvals");
  }

  async function handleHandoffStatus(formData: FormData) {
    "use server";

    const handoffId = String(formData.get("handoffId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    if (!handoffId || !HANDOFF_STATUSES.includes(status as (typeof HANDOFF_STATUSES)[number])) {
      return;
    }

    updateHandoffStatus({
      handoffId,
      status,
      actor: actorId,
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
    revalidatePath("/approvals");
  }

  async function handleTaskProject(formData: FormData) {
    "use server";

    const projectId = String(formData.get("projectId") ?? "").trim();
    updateTaskProject({ taskId, projectId: projectId || undefined, actor: actorId });
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
    revalidatePath("/projects");
  }

  async function handleLinkLane(formData: FormData) {
    "use server";

    const laneType = String(formData.get("laneType") ?? "").trim();
    const label = String(formData.get("label") ?? "").trim();
    const externalId = String(formData.get("externalId") ?? "").trim();
    if (!laneType || !label || !externalId) {
      return;
    }

    linkTaskLane({
      taskId,
      laneType,
      label,
      externalId,
      actor: actorId,
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleLinkGithubObject(formData: FormData) {
    "use server";

    const scope = String(formData.get("scope") ?? "task").trim();
    const flowId = String(formData.get("flowId") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim();
    const ref = String(formData.get("ref") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const repo = String(formData.get("repo") ?? "").trim();
    const state = String(formData.get("state") ?? "").trim();
    const url = String(formData.get("url") ?? "").trim();

    if (!type || !ref) {
      return;
    }

    if (scope === "flow" && flowId) {
      linkFlowGithubObject({
        flowId,
        type,
        ref,
        title,
        repo,
        state,
        url,
        actor: actorId,
      });
    } else {
      linkTaskGithubObject({
        taskId,
        type,
        ref,
        title,
        repo,
        state,
        url,
        actor: actorId,
      });
    }

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleCreateGithubIssue(formData: FormData) {
    "use server";

    const scope = String(formData.get("scope") ?? "task").trim();
    const flowId = String(formData.get("flowId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();

    const result = await createGithubIssueForWork({
      taskId,
      flowId: scope === "flow" ? flowId || undefined : undefined,
      actor: actorId,
      title: title || undefined,
      body: body || undefined,
    });

    if (result.ok) {
      revalidatePath(`/tasks/${taskId}`);
      revalidatePath("/tasks");

      const params = new URLSearchParams({
        githubIssueStatus: "success",
        githubIssueMessage: `Created ${result.linkedObject.ref} in ${result.linkedObject.repo ?? "GitHub"}.`,
      });
      redirect(`/tasks/${taskId}?${params.toString()}`);
    }

    const params = new URLSearchParams({
      githubIssueStatus: "error",
      githubIssueMessage: result.error,
    });
    redirect(`/tasks/${taskId}?${params.toString()}`);
  }

  async function handleEmitProtocolMessage(formData: FormData) {
    "use server";

    const type = String(formData.get("type") ?? "").trim();
    const from = String(formData.get("from") ?? "").trim();
    const to = String(formData.get("to") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const flowId = String(formData.get("flowId") ?? "").trim();
    const autonomyScope = String(formData.get("autonomyScope") ?? "").trim();

    if (
      !from ||
      !to ||
      !summary ||
      !PROTOCOL_MESSAGE_TYPES.includes(type as (typeof PROTOCOL_MESSAGE_TYPES)[number]) ||
      !AUTONOMY_SCOPES.includes(autonomyScope as (typeof AUTONOMY_SCOPES)[number])
    ) {
      return;
    }

    emitProtocolMessage({
      taskId,
      flowId: flowId || undefined,
      type,
      from,
      to,
      summary,
      autonomyScope,
      actor: actorId,
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleProtocolMessageStatus(formData: FormData) {
    "use server";

    const protocolMessageId = String(formData.get("protocolMessageId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const statusNote = String(formData.get("statusNote") ?? "").trim();

    if (!protocolMessageId || !PROTOCOL_STATUSES.includes(status as (typeof PROTOCOL_STATUSES)[number])) {
      return;
    }

    updateProtocolMessageStatus({
      protocolMessageId,
      status,
      statusNote: statusNote || undefined,
      actor: actorId,
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
  }

  async function handleDispatchFlowRun(formData: FormData) {
    "use server";

    const flowId = String(formData.get("flowId") ?? "").trim();
    const adapter = String(formData.get("adapter") ?? "").trim();
    const approvalId = String(formData.get("approvalId") ?? "").trim();

    if (!flowId || !RUN_ADAPTERS.includes(adapter as (typeof RUN_ADAPTERS)[number]) || !approvalId) {
      const params = new URLSearchParams({
        dispatchStatus: "error",
        dispatchMessage: "Flow dispatch requires a valid adapter and an approved approval.",
      });
      redirect(`/tasks/${taskId}?${params.toString()}`);
    }

    const agent = adapter === "acpx_gemini" ? "gemini" : "codex";
    const result = await dispatchFlowRun({
      flowId,
      adapter,
      agent,
      approvalId,
      requestedBy: actorId,
      triggerSource: "manual_dispatch",
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");

    const params = new URLSearchParams(
      result.ok
        ? {
            dispatchStatus: "success",
            dispatchMessage: `Run queued via ${adapter.replace("acpx_", "")}.`,
          }
        : {
            dispatchStatus: "error",
            dispatchMessage: result.error,
          },
    );
    redirect(`/tasks/${taskId}?${params.toString()}`);
  }

  const detail = getTaskDetail(taskId);
  const projects = listProjects();

  if (!detail) {
    notFound();
  }

  return (
    <AppShell activeTab="tasks">
      <div className="mc-heading-row">
        <Link href="/tasks" className="mc-filter-pill">
          ← Back to workboard
        </Link>
      </div>
      <TaskDetailScreen
        task={detail.task}
        flows={detail.flows}
        handoffs={detail.handoffs}
        approvals={detail.approvals}
        runs={detail.runs}
        protocolMessages={detail.protocolMessages}
        lanes={detail.lanes}
        timeline={detail.timeline}
        projects={projects}
        actorOptions={actorOptions}
        settings={settings}
        onUpdateTaskStatus={handleTaskStatus}
        onUpdateTaskOwner={handleTaskOwner}
        onUpdateTaskProject={handleTaskProject}
        onUpdateFlowStatus={handleFlowStatus}
        onUpdateFlowOwner={handleFlowOwner}
        onCreateFlow={handleCreateFlow}
        onSubmitHandoff={handleSubmitHandoff}
        onUpdateHandoffStatus={handleHandoffStatus}
        onRequestApproval={handleRequestApproval}
        onDispatchFlowRun={handleDispatchFlowRun}
        onLinkLane={handleLinkLane}
        onLinkGithubObject={handleLinkGithubObject}
        onCreateGithubIssue={handleCreateGithubIssue}
        onEmitProtocolMessage={handleEmitProtocolMessage}
        onUpdateProtocolMessageStatus={handleProtocolMessageStatus}
        githubIssueFeedback={
          statusParams.githubIssueStatus && statusParams.githubIssueMessage
            ? {
                tone: statusParams.githubIssueStatus === "success" ? "success" : "error",
                message: statusParams.githubIssueMessage,
              }
            : undefined
        }
        dispatchFeedback={
          statusParams.dispatchStatus && statusParams.dispatchMessage
            ? {
                tone: statusParams.dispatchStatus === "success" ? "success" : "error",
                message: statusParams.dispatchMessage,
              }
            : undefined
        }
      />
    </AppShell>
  );
}
