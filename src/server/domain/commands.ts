import { randomUUID } from "node:crypto";
import type { Approval, CanonicalTransition, Flow, Handoff, LinkedGithubObject, Project, ProtocolMessage, ProtocolReference, Run, RunErrorPayload, RunInputPayload, RunResultPayload, Settings, Task } from "@/domain/schema";
import {
  asApprovalStatus,
  asApprovalTargetType,
  asAutonomyScope,
  asFlowStatus,
  asFlowType,
  asHandoffStatus,
  asLaneType,
  asPriority,
  asRunAdapter,
  asRunStatus,
  asRunTriggerSource,
  asProtocolMessageType,
  asProtocolReferenceType,
  asProtocolStatus,
  asRiskCategory,
  asTaskStatus,
} from "@/domain/schema";
import { fromJson, getSqliteDb } from "@/server/db/sqlite";
import { ensureMissionControlFoundation } from "@/server/domain/bootstrap";
import { getActiveRunForFlow } from "@/server/domain/repository";
import {
  appendEvent,
  eventForFlowCreated,
  eventForHandoffStatusChanged,
  eventForHandoffSubmitted,
  eventForProtocolMessageEmitted,
  eventForProtocolMessageStatusChanged,
  eventForRunCanceled,
  eventForRunCompleted,
  eventForRunCreated,
  eventForRunFailed,
  eventForRunStarted,
  eventForTaskCreated,
  newEvent,
} from "@/server/domain/events";
import { projectEvent } from "@/server/domain/projector";
import { buildFlowExecutionPrompt } from "@/server/execution/prompt-builder";
import { createGithubService } from "@/server/integrations/github/service";

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    title: String(row.title),
    objective: String(row.objective),
    requester: String(row.requester),
    owner: String(row.owner),
    status: asTaskStatus(String(row.status)),
    priority: asPriority(String(row.priority)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    acceptanceCriteria: fromJson(row.acceptance_criteria_json as string | null, []),
    dependencies: fromJson(row.dependencies_json as string | null, []),
    linkedProjects: fromJson(row.linked_projects_json as string | null, []),
    linkedArtifacts: fromJson(row.linked_artifacts_json as string | null, []),
    linkedGithubObjects: fromJson(row.linked_github_objects_json as string | null, []),
    tags: fromJson(row.tags_json as string | null, []),
    summary: row.summary ? String(row.summary) : undefined,
  };
}

function mapApproval(row: Record<string, unknown>): Approval {
  return {
    id: String(row.id),
    targetType: asApprovalTargetType(String(row.target_type)),
    targetId: String(row.target_id),
    riskCategory: asRiskCategory(String(row.risk_category)),
    requestedAction: String(row.requested_action),
    requestedBy: String(row.requested_by),
    status: asApprovalStatus(String(row.status)),
    summary: row.summary ? String(row.summary) : undefined,
    evidence: fromJson(row.evidence_json as string | null, []),
    decisionBy: row.decision_by ? String(row.decision_by) : undefined,
    decisionReason: row.decision_reason ? String(row.decision_reason) : undefined,
    expiresAt: row.expires_at ? String(row.expires_at) : undefined,
    createdAt: String(row.created_at),
  };
}

function mapFlow(row: Record<string, unknown>): Flow {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    title: String(row.title),
    type: asFlowType(String(row.type)),
    owner: String(row.owner),
    status: asFlowStatus(String(row.status)),
    objective: row.objective ? String(row.objective) : undefined,
    inputs: fromJson(row.inputs_json as string | null, []),
    outputs: fromJson(row.outputs_json as string | null, []),
    dependencies: fromJson(row.dependencies_json as string | null, []),
    linkedLane: fromJson(row.linked_lane_json as string | null, null) ?? undefined,
    linkedArtifacts: fromJson(row.linked_artifacts_json as string | null, []),
    linkedGithubObjects: fromJson(row.linked_github_objects_json as string | null, []),
    summary: row.summary ? String(row.summary) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapProtocolMessage(row: Record<string, unknown>): ProtocolMessage {
  const references = fromJson<Array<{ type?: string; id?: string }>>(row.references_json as string | null, [])
    .filter((reference) => typeof reference?.id === "string")
    .map((reference) => ({
      type: asProtocolReferenceType(reference.type ?? "task"),
      id: String(reference.id),
    }));

  return {
    id: String(row.id),
    taskId: String(row.task_id),
    flowId: row.flow_id ? String(row.flow_id) : undefined,
    type: asProtocolMessageType(String(row.message_type)),
    from: String(row.from_actor),
    to: String(row.to_actor),
    summary: String(row.summary),
    autonomyScope: asAutonomyScope(String(row.autonomy_scope)),
    status: asProtocolStatus(String(row.status)),
    references,
    statusNote: row.status_note ? String(row.status_note) : undefined,
    handledBy: row.handled_by ? String(row.handled_by) : undefined,
    handledAt: row.handled_at ? String(row.handled_at) : undefined,
    canonicalTransition: (() => {
      const transition = fromJson<{ type?: string; id?: string; transition?: string } | null>(
        row.canonical_transition_json as string | null,
        null,
      );
      if (!transition?.id || !transition.transition) {
        return undefined;
      }
      return {
        type: asProtocolReferenceType(transition.type ?? "task"),
        id: String(transition.id),
        transition: String(transition.transition),
      } satisfies CanonicalTransition;
    })(),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapRun(row: Record<string, unknown>): Run {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    flowId: String(row.flow_id),
    status: asRunStatus(String(row.status)),
    adapter: asRunAdapter(String(row.adapter)),
    agent: String(row.agent),
    requestedBy: String(row.requested_by),
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    approvalId: row.approval_id ? String(row.approval_id) : undefined,
    triggerSource: row.trigger_source ? asRunTriggerSource(String(row.trigger_source)) : undefined,
    parentRunId: row.parent_run_id ? String(row.parent_run_id) : undefined,
    inputPayload: fromJson<RunInputPayload>(row.input_payload_json as string, {
      prompt: "",
      flowTitle: "",
      taskTitle: "",
      taskObjective: "",
      owner: "",
      actor: "",
    }),
    resultPayload: fromJson<RunResultPayload | null>(row.result_payload_json as string | null, null) ?? undefined,
    errorPayload: fromJson<RunErrorPayload | null>(row.error_payload_json as string | null, null) ?? undefined,
    startedAt: row.started_at ? String(row.started_at) : undefined,
    finishedAt: row.finished_at ? String(row.finished_at) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function saveEvent(event: ReturnType<typeof newEvent>) {
  appendEvent(event);
  projectEvent(event);
}

function loadTask(taskId: string) {
  const db = getSqliteDb();
  const taskRow = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Record<string, unknown> | undefined;
  if (!taskRow) {
    return null;
  }
  return mapTask(taskRow);
}

function loadFlow(flowId: string) {
  const db = getSqliteDb();
  const flowRow = db.prepare("SELECT * FROM flows WHERE id = ?").get(flowId) as Record<string, unknown> | undefined;
  if (!flowRow) {
    return null;
  }
  return mapFlow(flowRow);
}

function loadProtocolMessage(protocolMessageId: string) {
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM protocol_messages WHERE id = ?").get(protocolMessageId) as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  return mapProtocolMessage(row);
}

function loadHandoff(handoffId: string) {
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM handoffs WHERE id = ?").get(handoffId) as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    taskId: String(row.task_id),
    flowId: row.flow_id ? String(row.flow_id) : undefined,
    sourceFlowId: row.source_flow_id ? String(row.source_flow_id) : undefined,
    targetFlowId: row.target_flow_id ? String(row.target_flow_id) : undefined,
    from: String(row.from_actor),
    to: String(row.to_actor),
    intent: String(row.intent),
    expectedOutput: String(row.expected_output),
    constraints: fromJson(row.constraints_json as string | null, []),
    evidence: fromJson(row.evidence_json as string | null, []),
    confidence: typeof row.confidence === "number" ? row.confidence : undefined,
    openQuestions: fromJson(row.open_questions_json as string | null, []),
    status: asHandoffStatus(String(row.status ?? "open")),
    createdAt: String(row.created_at),
  } satisfies Handoff;
}

function loadRun(runId: string) {
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM runs WHERE id = ?").get(runId) as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  return mapRun(row);
}

function loadApproval(approvalId: string) {
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM approvals WHERE id = ?").get(approvalId) as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  return mapApproval(row);
}

function loadProject(projectId: string) {
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }

  const project: Project = {
    id: String(row.id),
    name: String(row.name),
    status: String(row.status) as Project["status"],
    githubRepo: row.github_repo ? String(row.github_repo) : undefined,
    githubDefaultBaseBranch: row.github_default_base_branch ? String(row.github_default_base_branch) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };

  return project;
}

function loadSettings() {
  const db = getSqliteDb();
  const row = db.prepare("SELECT payload_json FROM settings WHERE id = 'default'").get() as { payload_json: string } | undefined;
  if (!row) {
    return null;
  }

  const fallback: Settings = {
    id: "default",
    operators: {
      defaultOperatorId: "giuseppe",
      defaultOperatorLabel: "Giuseppe",
      actorRoster: [
        { id: "giuseppe", label: "Giuseppe" },
        { id: "cisco", label: "Cisco" },
        { id: "senior-builder", label: "Senior Builder" },
        { id: "sentry", label: "Sentry" },
      ],
    },
    approvalDefaults: { autoApproveBelowRisk: "low", requireApprovalFor: ["high"] },
    riskDefaults: { destructiveThreshold: "high", externalCommunicationThreshold: "high" },
    display: { defaultWorkboardView: "kanban", showCompletedByDefault: false },
    laneDefaults: { preferredImplementationLane: "openclaw_session" },
    githubDefaults: {
      enableLinking: true,
      defaultRepo: undefined,
      defaultBaseBranch: "main",
      issueCreationMode: "manual",
      pullRequestMode: "manual",
    },
    retention: { timelineRetentionDays: 180 },
    updatedAt: new Date().toISOString(),
  };

  const settings = fromJson<Settings>(row.payload_json, fallback);
  return {
    ...fallback,
    ...settings,
    operators: settings.operators ?? fallback.operators,
    approvalDefaults: settings.approvalDefaults ?? fallback.approvalDefaults,
    riskDefaults: settings.riskDefaults ?? fallback.riskDefaults,
    display: settings.display ?? fallback.display,
    laneDefaults: settings.laneDefaults ?? fallback.laneDefaults,
    githubDefaults: settings.githubDefaults ?? fallback.githubDefaults,
    retention: settings.retention ?? fallback.retention,
  };
}

function touchTask(taskId: string, actor: string) {
  const task = loadTask(taskId);
  if (!task) {
    return;
  }

  const now = new Date().toISOString();
  const updatedTask: Task = {
    ...task,
    updatedAt: now,
  };

  saveEvent(
    newEvent({
      aggregateType: "task",
      aggregateId: updatedTask.id,
      taskId: updatedTask.id,
      type: "task_updated",
      actor,
      payload: { task: updatedTask },
    }),
  );
}

function emitProtocolMessageRecord(input: {
  taskId: string;
  actor: string;
  type: string;
  from: string;
  to: string;
  summary: string;
  autonomyScope: string;
  status?: string;
  flowId?: string;
  references?: ProtocolReference[];
  statusNote?: string;
  handledBy?: string;
  handledAt?: string;
}) {
  const now = new Date().toISOString();
  const protocolMessage: ProtocolMessage = {
    id: randomUUID(),
    taskId: input.taskId,
    flowId: input.flowId,
    type: asProtocolMessageType(input.type),
    from: input.from.trim(),
    to: input.to.trim(),
    summary: input.summary.trim(),
    autonomyScope: asAutonomyScope(input.autonomyScope),
    status: asProtocolStatus(input.status ?? "open"),
    references: input.references ?? [],
    statusNote: input.statusNote?.trim() || undefined,
    handledBy: input.handledBy?.trim() || undefined,
    handledAt: input.handledAt,
    createdAt: now,
    updatedAt: now,
  };

  saveEvent(eventForProtocolMessageEmitted(protocolMessage, input.actor));
  return protocolMessage;
}

function updateProtocolMessageStatusRecord(input: {
  protocolMessage: ProtocolMessage;
  status: string;
  actor: string;
  statusNote?: string;
  canonicalTransition?: CanonicalTransition;
}) {
  const nextStatus = asProtocolStatus(input.status);
  const nextNote = input.statusNote?.trim() || undefined;
  if ((nextStatus === "blocked" || nextStatus === "escalated") && !nextNote) {
    return null;
  }

  const unchanged =
    input.protocolMessage.status === nextStatus && (input.protocolMessage.statusNote ?? "") === (nextNote ?? "");
  if (unchanged) {
    return input.protocolMessage;
  }

  const now = new Date().toISOString();
  const updatedMessage: ProtocolMessage = {
    ...input.protocolMessage,
    status: nextStatus,
    statusNote: nextNote,
    handledBy: input.actor,
    handledAt: now,
    canonicalTransition: input.canonicalTransition ?? input.protocolMessage.canonicalTransition,
    updatedAt: now,
  };

  saveEvent(
    eventForProtocolMessageStatusChanged({
      message: updatedMessage,
      actor: input.actor,
      previousStatus: input.protocolMessage.status,
    }),
  );

  return updatedMessage;
}

function listProtocolMessagesByReference(input: {
  reference: ProtocolReference;
  statuses?: string[];
}) {
  const db = getSqliteDb();
  const statuses = input.statuses ?? ["open", "acknowledged", "blocked", "escalated"];
  const placeholders = statuses.map(() => "?").join(", ");
  const rows = db
    .prepare(`SELECT * FROM protocol_messages WHERE status IN (${placeholders})`)
    .all(...statuses) as Record<string, unknown>[];

  return rows
    .map(mapProtocolMessage)
    .filter((message) =>
      message.references?.some((item) => item.type === input.reference.type && item.id === input.reference.id),
    );
}

function transitionProtocolMessagesForReference(input: {
  reference: ProtocolReference;
  status: string;
  actor: string;
  statusNote: string;
  messageTypes?: string[];
  sourceStatuses?: string[];
  canonicalTransition?: CanonicalTransition;
}) {
  const messages = listProtocolMessagesByReference({
    reference: input.reference,
    statuses: input.sourceStatuses,
  });
  const filteredMessages = input.messageTypes?.length
    ? messages.filter((message) => input.messageTypes?.includes(message.type))
    : messages;
  if (filteredMessages.length === 0) {
    return 0;
  }

  const touchedTaskIds = new Set<string>();
  for (const message of filteredMessages) {
    const updated = updateProtocolMessageStatusRecord({
      protocolMessage: message,
      status: input.status,
      actor: input.actor,
      statusNote: input.statusNote,
      canonicalTransition: input.canonicalTransition,
    });
    if (updated) {
      touchedTaskIds.add(updated.taskId);
    }
  }

  for (const taskId of touchedTaskIds) {
    touchTask(taskId, input.actor);
  }

  return touchedTaskIds.size;
}

export function createTask(input: {
  title: string;
  objective: string;
  requester: string;
  owner: string;
  priority?: string;
}) {
  ensureMissionControlFoundation();
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    title: input.title.trim(),
    objective: input.objective.trim(),
    requester: input.requester.trim(),
    owner: input.owner.trim(),
    status: "drafted",
    priority: asPriority(input.priority ?? "normal"),
    createdAt: now,
    updatedAt: now,
    acceptanceCriteria: [],
    dependencies: [],
    linkedProjects: [],
    linkedArtifacts: [],
    linkedGithubObjects: [],
    tags: [],
  };
  saveEvent(eventForTaskCreated(task, input.requester.trim()));
  return task;
}

export function updateTaskStatus(input: { taskId: string; status: string; actor: string }) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  if (!task) {
    return null;
  }

  const updatedTask: Task = {
    ...task,
    status: asTaskStatus(input.status),
    updatedAt: new Date().toISOString(),
  };

  saveEvent(
    newEvent({
      aggregateType: "task",
      aggregateId: updatedTask.id,
      taskId: updatedTask.id,
      type: "task_status_changed",
      actor: input.actor,
      payload: { task: updatedTask },
      timeline: {
        actor: input.actor,
        type: "task_status_changed",
        summary: `Task status changed to ${updatedTask.status}`,
        payload: { status: updatedTask.status },
      },
    }),
  );

  return updatedTask;
}

export function updateTaskOwner(input: { taskId: string; owner: string; actor: string }) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  if (!task) {
    return null;
  }

  const updatedTask: Task = {
    ...task,
    owner: input.owner.trim(),
    updatedAt: new Date().toISOString(),
  };

  saveEvent(
    newEvent({
      aggregateType: "task",
      aggregateId: updatedTask.id,
      taskId: updatedTask.id,
      type: "task_owner_changed",
      actor: input.actor,
      payload: { task: updatedTask },
      timeline: {
        actor: input.actor,
        type: "task_owner_changed",
        summary: `Task owner changed to ${updatedTask.owner}`,
        payload: { owner: updatedTask.owner },
      },
    }),
  );

  return updatedTask;
}

export function updateTaskProject(input: { taskId: string; projectId?: string; actor: string }) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  if (!task) {
    return null;
  }

  const updatedTask: Task = {
    ...task,
    linkedProjects: input.projectId ? [input.projectId] : [],
    updatedAt: new Date().toISOString(),
  };

  saveEvent(
    newEvent({
      aggregateType: "task",
      aggregateId: updatedTask.id,
      taskId: updatedTask.id,
      type: "task_updated",
      actor: input.actor,
      payload: { task: updatedTask },
      timeline: {
        actor: input.actor,
        type: "task_updated",
        summary: input.projectId ? "Task project linked" : "Task project cleared",
        payload: { linkedProjects: updatedTask.linkedProjects ?? [] },
      },
    }),
  );

  return updatedTask;
}

export function createFlow(input: {
  taskId: string;
  title: string;
  type: string;
  owner: string;
  objective?: string;
  actor: string;
}) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  if (!task) {
    return null;
  }

  const now = new Date().toISOString();
  const flow: Flow = {
    id: randomUUID(),
    taskId: input.taskId,
    title: input.title.trim(),
    type: asFlowType(input.type),
    owner: input.owner.trim(),
    status: "ready",
    objective: input.objective?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  saveEvent(eventForFlowCreated(flow, input.actor));
  touchTask(input.taskId, input.actor);
  return flow;
}

export function updateFlowStatus(input: { flowId: string; status: string; actor: string }) {
  ensureMissionControlFoundation();
  const flow = loadFlow(input.flowId);
  if (!flow) {
    return null;
  }

  const updatedFlow: Flow = {
    ...flow,
    status: asFlowStatus(input.status),
    updatedAt: new Date().toISOString(),
  };

  saveEvent(
    newEvent({
      aggregateType: "flow",
      aggregateId: updatedFlow.id,
      taskId: updatedFlow.taskId,
      flowId: updatedFlow.id,
      type: "flow_status_changed",
      actor: input.actor,
      payload: { flow: updatedFlow },
      timeline: {
        actor: input.actor,
        flowId: updatedFlow.id,
        type: "flow_status_changed",
        summary: `Flow status changed to ${updatedFlow.status}`,
        payload: { flowTitle: updatedFlow.title, status: updatedFlow.status },
      },
    }),
  );

  if (updatedFlow.status === "active" || updatedFlow.status === "validating" || updatedFlow.status === "in_review") {
    transitionProtocolMessagesForReference({
      reference: { type: "flow", id: updatedFlow.id },
      status: "acknowledged",
      actor: input.actor,
      statusNote: `Acknowledged via flow status ${updatedFlow.status} on ${new Date().toISOString()}`,
      messageTypes: ["blocker_raise", "escalation_raise"],
      canonicalTransition: { type: "flow", id: updatedFlow.id, transition: `flow_status:${updatedFlow.status}` },
    });
  }

  if (updatedFlow.status === "blocked") {
    transitionProtocolMessagesForReference({
      reference: { type: "flow", id: updatedFlow.id },
      status: "blocked",
      actor: input.actor,
      statusNote: `Reopened via flow regression to blocked on ${new Date().toISOString()}`,
      messageTypes: ["blocker_raise", "escalation_raise"],
      sourceStatuses: ["acknowledged", "resolved"],
      canonicalTransition: { type: "flow", id: updatedFlow.id, transition: `flow_status:${updatedFlow.status}` },
    });
  }

  if (updatedFlow.status === "approved" || updatedFlow.status === "done" || updatedFlow.status === "superseded") {
    transitionProtocolMessagesForReference({
      reference: { type: "flow", id: updatedFlow.id },
      status: "resolved",
      actor: input.actor,
      statusNote: `Resolved via flow status ${updatedFlow.status} on ${new Date().toISOString()}`,
      messageTypes: ["blocker_raise", "escalation_raise"],
      canonicalTransition: { type: "flow", id: updatedFlow.id, transition: `flow_status:${updatedFlow.status}` },
    });
  }

  touchTask(updatedFlow.taskId, input.actor);
  return updatedFlow;
}

export function updateFlowOwner(input: { flowId: string; owner: string; actor: string }) {
  ensureMissionControlFoundation();
  const flow = loadFlow(input.flowId);
  if (!flow) {
    return null;
  }

  const updatedFlow: Flow = {
    ...flow,
    owner: input.owner.trim(),
    updatedAt: new Date().toISOString(),
  };

  saveEvent(
    newEvent({
      aggregateType: "flow",
      aggregateId: updatedFlow.id,
      taskId: updatedFlow.taskId,
      flowId: updatedFlow.id,
      type: "flow_updated",
      actor: input.actor,
      payload: { flow: updatedFlow },
      timeline: {
        actor: input.actor,
        flowId: updatedFlow.id,
        type: "flow_updated",
        summary: `Flow owner changed to ${updatedFlow.owner}`,
        payload: { flowTitle: updatedFlow.title, owner: updatedFlow.owner },
      },
    }),
  );

  touchTask(updatedFlow.taskId, input.actor);
  return updatedFlow;
}

export function linkTaskGithubObject(input: {
  taskId: string;
  type: string;
  ref: string;
  title?: string;
  repo?: string;
  state?: string;
  url?: string;
  actor: string;
}) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  if (!task) {
    return null;
  }

  const linkedObject: LinkedGithubObject = createGithubService().normalizeLink(input);

  const nextLinks = [...(task.linkedGithubObjects ?? []).filter((item) => !(item.type === linkedObject.type && item.ref === linkedObject.ref)), linkedObject];
  const updatedTask: Task = {
    ...task,
    linkedGithubObjects: nextLinks,
    updatedAt: new Date().toISOString(),
  };

  saveEvent(
    newEvent({
      aggregateType: "task",
      aggregateId: updatedTask.id,
      taskId: updatedTask.id,
      type: "task_updated",
      actor: input.actor,
      payload: { task: updatedTask },
      timeline: {
        actor: input.actor,
        type: "task_updated",
        summary: `GitHub ${linkedObject.type} linked to task`,
        payload: { githubRef: linkedObject.ref, githubType: linkedObject.type },
      },
    }),
  );

  return linkedObject;
}

export function linkFlowGithubObject(input: {
  flowId: string;
  type: string;
  ref: string;
  title?: string;
  repo?: string;
  state?: string;
  url?: string;
  actor: string;
}) {
  ensureMissionControlFoundation();
  const flow = loadFlow(input.flowId);
  if (!flow) {
    return null;
  }

  const linkedObject: LinkedGithubObject = createGithubService().normalizeLink(input);

  const nextLinks = [...(flow.linkedGithubObjects ?? []).filter((item) => !(item.type === linkedObject.type && item.ref === linkedObject.ref)), linkedObject];
  const updatedFlow: Flow = {
    ...flow,
    linkedGithubObjects: nextLinks,
    updatedAt: new Date().toISOString(),
  };

  saveEvent(
    newEvent({
      aggregateType: "flow",
      aggregateId: updatedFlow.id,
      taskId: updatedFlow.taskId,
      flowId: updatedFlow.id,
      type: "flow_updated",
      actor: input.actor,
      payload: { flow: updatedFlow },
      timeline: {
        actor: input.actor,
        flowId: updatedFlow.id,
        type: "flow_updated",
        summary: `GitHub ${linkedObject.type} linked to flow`,
        payload: { githubRef: linkedObject.ref, githubType: linkedObject.type },
      },
    }),
  );

  touchTask(updatedFlow.taskId, input.actor);
  return linkedObject;
}

export async function createGithubIssueForWork(input: {
  taskId: string;
  flowId?: string;
  actor: string;
  title?: string;
  body?: string;
}) {
  ensureMissionControlFoundation();

  const task = loadTask(input.taskId);
  if (!task) {
    return {
      ok: false as const,
      error: "Task not found.",
    };
  }

  const flow = input.flowId ? loadFlow(input.flowId) : null;
  if (input.flowId && (!flow || flow.taskId !== task.id)) {
    return {
      ok: false as const,
      error: "Flow not found for this task.",
    };
  }

  const projectId = task.linkedProjects?.[0];
  const project = projectId ? loadProject(projectId) : null;
  const settings = loadSettings();
  const github = createGithubService();
  const integration = github.getIntegrationStatus(project, settings);

  if (!integration.canWrite || !integration.repo) {
    return {
      ok: false as const,
      error: integration.writeBlockedReason ?? "GitHub issue creation is not available.",
    };
  }

  const issueTitle = input.title?.trim() || (flow ? `${task.title}: ${flow.title}` : task.title);
  const issueBody =
    input.body?.trim() ||
    [
      `Mission Control task: ${task.title}`,
      "",
      `Task ID: ${task.id}`,
      `Owner: ${task.owner}`,
      `Status: ${task.status}`,
      project ? `Project: ${project.name}` : undefined,
      flow ? "" : undefined,
      flow ? `Flow: ${flow.title}` : undefined,
      flow ? `Flow ID: ${flow.id}` : undefined,
      flow ? `Flow owner: ${flow.owner}` : undefined,
      flow ? `Flow status: ${flow.status}` : undefined,
      "",
      task.objective,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");

  const created = await github.createIssue({
    repo: integration.repo,
    title: issueTitle,
    body: issueBody,
  });

  if (!created.ok) {
    return {
      ok: false as const,
      error: created.error,
    };
  }

  const linkedObject = created.issue;

  if (flow) {
    const nextLinks = [...(flow.linkedGithubObjects ?? []).filter((item) => !(item.type === linkedObject.type && item.ref === linkedObject.ref)), linkedObject];
    const updatedFlow: Flow = {
      ...flow,
      linkedGithubObjects: nextLinks,
      updatedAt: new Date().toISOString(),
    };

    saveEvent(
      newEvent({
        aggregateType: "flow",
        aggregateId: updatedFlow.id,
        taskId: updatedFlow.taskId,
        flowId: updatedFlow.id,
        type: "flow_updated",
        actor: input.actor,
        payload: { flow: updatedFlow },
        timeline: {
          actor: input.actor,
          flowId: updatedFlow.id,
          type: "flow_updated",
          summary: "GitHub issue created from Mission Control",
          payload: { githubRef: linkedObject.ref, githubType: linkedObject.type },
        },
      }),
    );
    touchTask(updatedFlow.taskId, input.actor);
  } else {
    const nextLinks = [...(task.linkedGithubObjects ?? []).filter((item) => !(item.type === linkedObject.type && item.ref === linkedObject.ref)), linkedObject];
    const updatedTask: Task = {
      ...task,
      linkedGithubObjects: nextLinks,
      updatedAt: new Date().toISOString(),
    };

    saveEvent(
      newEvent({
        aggregateType: "task",
        aggregateId: updatedTask.id,
        taskId: updatedTask.id,
        type: "task_updated",
        actor: input.actor,
        payload: { task: updatedTask },
        timeline: {
          actor: input.actor,
          type: "task_updated",
          summary: "GitHub issue created from Mission Control",
          payload: { githubRef: linkedObject.ref, githubType: linkedObject.type },
        },
      }),
    );
  }

  return {
    ok: true as const,
    linkedObject,
  };
}

export function submitHandoff(input: {
  taskId: string;
  from: string;
  to: string;
  intent: string;
  expectedOutput: string;
  flowId?: string;
  sourceFlowId?: string;
  targetFlowId?: string;
  actor: string;
}) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  if (!task) {
    return null;
  }

  const handoff: Handoff = {
    id: randomUUID(),
    taskId: input.taskId,
    from: input.from.trim(),
    to: input.to.trim(),
    intent: input.intent.trim(),
    expectedOutput: input.expectedOutput.trim(),
    flowId: input.flowId || undefined,
    sourceFlowId: input.sourceFlowId || undefined,
    targetFlowId: input.targetFlowId || undefined,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  saveEvent(eventForHandoffSubmitted(handoff, input.actor));
  emitProtocolMessageRecord({
    taskId: input.taskId,
    flowId: handoff.flowId ?? handoff.targetFlowId,
    actor: input.actor,
    type: "handoff_submit",
    from: handoff.from,
    to: handoff.to,
    summary: handoff.intent,
    autonomyScope: "within_policy",
    references: [
      { type: "handoff", id: handoff.id },
      ...(handoff.targetFlowId ? [{ type: "flow" as const, id: handoff.targetFlowId }] : []),
    ],
  });
  touchTask(input.taskId, input.actor);
  return handoff;
}

export function requestApproval(input: {
  taskId: string;
  flowId?: string;
  requestedAction: string;
  riskCategory: string;
  requestedBy: string;
  summary?: string;
}) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  if (!task) {
    return null;
  }

  const approval: Approval = {
    id: randomUUID(),
    targetType: input.flowId ? "flow" : "task",
    targetId: input.flowId ?? input.taskId,
    riskCategory: asRiskCategory(input.riskCategory),
    requestedAction: input.requestedAction.trim(),
    requestedBy: input.requestedBy.trim(),
    status: "pending",
    summary: input.summary?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  saveEvent(
    newEvent({
      aggregateType: "approval",
      aggregateId: approval.id,
      taskId: input.taskId,
      flowId: input.flowId,
      type: "approval_requested",
      actor: input.requestedBy.trim(),
      payload: { approval, taskId: input.taskId },
      timeline: {
        actor: input.requestedBy.trim(),
        flowId: input.flowId,
        type: "approval_requested",
        summary: `${approval.riskCategory} risk approval requested`,
        payload: { requestedAction: approval.requestedAction },
      },
    }),
  );

  emitProtocolMessageRecord({
    taskId: input.taskId,
    flowId: input.flowId,
    actor: input.requestedBy.trim(),
    type: "approval_request",
    from: input.requestedBy.trim(),
    to: "Approval Queue",
    summary: approval.requestedAction,
    autonomyScope: "approval_required",
    references: [
      { type: "approval", id: approval.id },
      { type: input.flowId ? "flow" : "task", id: approval.targetId },
    ],
  });

  touchTask(input.taskId, input.requestedBy.trim());
  return approval;
}

export function emitProtocolMessage(input: {
  taskId: string;
  flowId?: string;
  type: string;
  from: string;
  to: string;
  summary: string;
  autonomyScope: string;
  actor: string;
}) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  if (!task) {
    return null;
  }

  if (input.flowId) {
    const flow = loadFlow(input.flowId);
    if (!flow || flow.taskId !== input.taskId) {
      return null;
    }
  }

  const protocolMessage = emitProtocolMessageRecord({
    taskId: input.taskId,
    flowId: input.flowId,
    actor: input.actor,
    type: input.type,
    from: input.from,
    to: input.to,
    summary: input.summary,
    autonomyScope: input.autonomyScope,
    references: [{ type: input.flowId ? "flow" : "task", id: input.flowId ?? input.taskId }],
  });

  touchTask(input.taskId, input.actor);
  return protocolMessage;
}

export function updateProtocolMessageStatus(input: {
  protocolMessageId: string;
  status: string;
  actor: string;
  statusNote?: string;
}) {
  ensureMissionControlFoundation();
  const existing = loadProtocolMessage(input.protocolMessageId);
  if (!existing) {
    return null;
  }

  const updatedMessage = updateProtocolMessageStatusRecord({
    protocolMessage: existing,
    status: input.status,
    actor: input.actor,
    statusNote: input.statusNote,
  });
  if (!updatedMessage) {
    return null;
  }

  touchTask(existing.taskId, input.actor);
  return updatedMessage;
}

export function updateHandoffStatus(input: {
  handoffId: string;
  status: string;
  actor: string;
}) {
  ensureMissionControlFoundation();
  const handoff = loadHandoff(input.handoffId);
  if (!handoff) {
    return null;
  }

  const nextStatus = asHandoffStatus(input.status);
  if (handoff.status === nextStatus) {
    return handoff;
  }

  const updatedHandoff: Handoff = {
    ...handoff,
    status: nextStatus,
  };

  saveEvent(eventForHandoffStatusChanged(updatedHandoff, input.actor));

  if (nextStatus === "accepted") {
    transitionProtocolMessagesForReference({
      reference: { type: "handoff", id: updatedHandoff.id },
      status: "acknowledged",
      actor: input.actor,
      statusNote: `Acknowledged via handoff acceptance on ${new Date().toISOString()}`,
      sourceStatuses: ["open", "acknowledged", "resolved"],
      canonicalTransition: { type: "handoff", id: updatedHandoff.id, transition: `handoff_status:${nextStatus}` },
    });
  }

  if (nextStatus === "open") {
    transitionProtocolMessagesForReference({
      reference: { type: "handoff", id: updatedHandoff.id },
      status: "open",
      actor: input.actor,
      statusNote: `Reopened via handoff regression to open on ${new Date().toISOString()}`,
      sourceStatuses: ["acknowledged", "resolved"],
      canonicalTransition: { type: "handoff", id: updatedHandoff.id, transition: `handoff_status:${nextStatus}` },
    });
  }

  if (nextStatus === "completed" || nextStatus === "cancelled") {
    transitionProtocolMessagesForReference({
      reference: { type: "handoff", id: updatedHandoff.id },
      status: "resolved",
      actor: input.actor,
      statusNote: `Resolved via handoff ${nextStatus} on ${new Date().toISOString()}`,
      canonicalTransition: { type: "handoff", id: updatedHandoff.id, transition: `handoff_status:${nextStatus}` },
    });
  }

  touchTask(updatedHandoff.taskId, input.actor);
  return updatedHandoff;
}

export function linkTaskLane(input: {
  taskId: string;
  laneType: string;
  label: string;
  externalId: string;
  actor: string;
}) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  if (!task) {
    return null;
  }

  const lane = {
    id: randomUUID(),
    type: asLaneType(input.laneType),
    label: input.label.trim(),
    externalId: input.externalId.trim(),
  };

  saveEvent(
    newEvent({
      aggregateType: "lane",
      aggregateId: lane.id,
      taskId: input.taskId,
      type: "lane_linked",
      actor: input.actor,
      payload: { lane },
      timeline: {
        actor: input.actor,
        type: "lane_linked",
        summary: `Lane linked: ${lane.label}`,
        payload: { laneType: lane.type, externalId: lane.externalId },
      },
    }),
  );

  touchTask(input.taskId, input.actor);
  return lane;
}

export function decideApproval(input: {
  approvalId: string;
  decisionBy: string;
  decision: "approved" | "rejected";
  decisionReason?: string;
}) {
  ensureMissionControlFoundation();
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM approvals WHERE id = ?").get(input.approvalId) as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }

  const existing = mapApproval(row);
  if (existing.status !== "pending") {
    return {
      taskId: String(row.task_id),
      approvalId: existing.id,
      changed: false,
    };
  }

  const updated: Approval = {
    ...existing,
    status: input.decision,
    decisionBy: input.decisionBy,
    decisionReason: input.decisionReason?.trim() || undefined,
  };
  const taskId = String(row.task_id);

  const event = newEvent({
    aggregateType: "approval",
    aggregateId: updated.id,
    taskId,
    flowId: updated.targetType === "flow" ? updated.targetId : undefined,
    type: "approval_decided",
    actor: input.decisionBy,
    payload: { approval: updated, taskId },
    timeline: {
      actor: input.decisionBy,
      flowId: updated.targetType === "flow" ? updated.targetId : undefined,
      type: "approval_decided",
      summary: `Approval ${input.decision}`,
      payload: {
        requestedAction: updated.requestedAction,
        decisionReason: updated.decisionReason ?? null,
      },
    },
  });

  saveEvent(event);
  transitionProtocolMessagesForReference({
    reference: { type: "approval", id: updated.id },
    status: "resolved",
    actor: input.decisionBy,
    statusNote: `Resolved via approval ${input.decision} on ${new Date().toISOString()}`,
    canonicalTransition: { type: "approval", id: updated.id, transition: `approval_decision:${input.decision}` },
  });
  touchTask(taskId, input.decisionBy);

  return {
    taskId,
    approvalId: updated.id,
    changed: true,
  };
}

export function createRun(input: {
  taskId: string;
  flowId: string;
  adapter: string;
  agent: string;
  requestedBy: string;
  approvedBy?: string;
  approvalId?: string;
  triggerSource?: string;
  parentRunId?: string;
  inputPayload: RunInputPayload;
}) {
  ensureMissionControlFoundation();
  const task = loadTask(input.taskId);
  const flow = loadFlow(input.flowId);
  if (!task || !flow || flow.taskId !== task.id) {
    return null;
  }

  const now = new Date().toISOString();
  const run: Run = {
    id: randomUUID(),
    taskId: input.taskId,
    flowId: input.flowId,
    status: "queued",
    adapter: asRunAdapter(input.adapter),
    agent: input.agent.trim(),
    requestedBy: input.requestedBy.trim(),
    approvedBy: input.approvedBy?.trim() || undefined,
    approvalId: input.approvalId?.trim() || undefined,
    triggerSource: input.triggerSource ? asRunTriggerSource(input.triggerSource) : undefined,
    parentRunId: input.parentRunId?.trim() || undefined,
    inputPayload: input.inputPayload,
    createdAt: now,
    updatedAt: now,
  };

  saveEvent(eventForRunCreated(run, input.requestedBy.trim()));
  touchTask(run.taskId, input.requestedBy.trim());
  return run;
}

export function markRunStarted(input: {
  runId: string;
  actor: string;
}) {
  ensureMissionControlFoundation();
  const run = loadRun(input.runId);
  if (!run) {
    return null;
  }
  if (run.status !== "queued") {
    return run;
  }

  const now = new Date().toISOString();
  const updatedRun: Run = {
    ...run,
    status: "running",
    startedAt: run.startedAt ?? now,
    updatedAt: now,
  };

  saveEvent(eventForRunStarted(updatedRun, input.actor));
  touchTask(updatedRun.taskId, input.actor);
  return updatedRun;
}

export function markRunCompleted(input: {
  runId: string;
  actor: string;
  resultPayload: RunResultPayload;
}) {
  ensureMissionControlFoundation();
  const run = loadRun(input.runId);
  if (!run) {
    return null;
  }
  if (run.status === "completed" || run.status === "failed" || run.status === "canceled") {
    return run;
  }

  const now = new Date().toISOString();
  const updatedRun: Run = {
    ...run,
    status: "completed",
    startedAt: run.startedAt ?? now,
    finishedAt: now,
    resultPayload: input.resultPayload,
    errorPayload: undefined,
    updatedAt: now,
  };

  saveEvent(eventForRunCompleted(updatedRun, input.actor));
  touchTask(updatedRun.taskId, input.actor);
  return updatedRun;
}

export function markRunFailed(input: {
  runId: string;
  actor: string;
  errorPayload: RunErrorPayload;
}) {
  ensureMissionControlFoundation();
  const run = loadRun(input.runId);
  if (!run) {
    return null;
  }
  if (run.status === "completed" || run.status === "failed" || run.status === "canceled") {
    return run;
  }

  const now = new Date().toISOString();
  const updatedRun: Run = {
    ...run,
    status: "failed",
    startedAt: run.startedAt ?? now,
    finishedAt: now,
    errorPayload: input.errorPayload,
    resultPayload: undefined,
    updatedAt: now,
  };

  saveEvent(eventForRunFailed(updatedRun, input.actor));
  touchTask(updatedRun.taskId, input.actor);
  return updatedRun;
}

export function markRunCanceled(input: {
  runId: string;
  actor: string;
  errorPayload?: RunErrorPayload;
}) {
  ensureMissionControlFoundation();
  const run = loadRun(input.runId);
  if (!run) {
    return null;
  }
  if (run.status === "completed" || run.status === "failed" || run.status === "canceled") {
    return run;
  }

  const now = new Date().toISOString();
  const updatedRun: Run = {
    ...run,
    status: "canceled",
    startedAt: run.startedAt,
    finishedAt: now,
    errorPayload: input.errorPayload ?? run.errorPayload,
    updatedAt: now,
  };

  saveEvent(eventForRunCanceled(updatedRun, input.actor));
  touchTask(updatedRun.taskId, input.actor);
  return updatedRun;
}

export async function dispatchFlowRun(input: {
  flowId: string;
  adapter: string;
  agent: string;
  requestedBy: string;
  approvalId?: string;
  triggerSource?: string;
  parentRunId?: string;
}) {
  ensureMissionControlFoundation();

  const flow = loadFlow(input.flowId);
  if (!flow) {
    return {
      ok: false as const,
      error: "Flow not found.",
    };
  }

  const task = loadTask(flow.taskId);
  if (!task) {
    return {
      ok: false as const,
      error: "Task not found for flow.",
    };
  }

  const activeRun = getActiveRunForFlow(flow.id);
  if (activeRun) {
    return {
      ok: false as const,
      error: "An active run already exists for this flow.",
    };
  }

  const approvalId = input.approvalId?.trim();
  if (!approvalId) {
    return {
      ok: false as const,
      error: "Dispatch requires an approved approval record.",
    };
  }

  const approval = loadApproval(approvalId);
  if (!approval) {
    return {
      ok: false as const,
      error: "Approval not found.",
    };
  }

  if (approval.status !== "approved") {
    return {
      ok: false as const,
      error: "Approval is not approved.",
    };
  }

  const approvalMatchesFlow =
    (approval.targetType === "flow" && approval.targetId === flow.id) ||
    (approval.targetType === "task" && approval.targetId === task.id);

  if (!approvalMatchesFlow) {
    return {
      ok: false as const,
      error: "Approval does not apply to this flow dispatch.",
    };
  }

  const prompt = buildFlowExecutionPrompt({ task, flow });
  const run = createRun({
    taskId: task.id,
    flowId: flow.id,
    adapter: input.adapter,
    agent: input.agent,
    requestedBy: input.requestedBy,
    approvedBy: approval.decisionBy,
    approvalId: approval.id,
    triggerSource: input.triggerSource,
    parentRunId: input.parentRunId,
    inputPayload: {
      prompt,
      flowTitle: flow.title,
      flowObjective: flow.objective,
      taskTitle: task.title,
      taskObjective: task.objective,
      owner: flow.owner,
      actor: input.requestedBy,
    },
  });

  if (!run) {
    return {
      ok: false as const,
      error: "Run could not be created.",
    };
  }

  const { dispatchRun } = await import("@/server/execution/dispatcher");
  void dispatchRun(run.id);

  return {
    ok: true as const,
    run,
  };
}
