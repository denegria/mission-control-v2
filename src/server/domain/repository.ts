import type { Approval, CanonicalTransition, Flow, Handoff, LaneLink, Project, ProtocolMessage, ProtocolReference, Settings, Task, TimelineEvent } from "@/domain/schema";
import {
  asApprovalStatus,
  asApprovalTargetType,
  asAutonomyScope,
  asFlowStatus,
  asFlowType,
  asHandoffStatus,
  asPriority,
  asProtocolMessageType,
  asProtocolReferenceType,
  asProtocolStatus,
  asRiskCategory,
  asTaskStatus,
} from "@/domain/schema";
import type { ProtocolExceptionInboxItem, TaskWorkboardItem } from "@/domain/tasks";
import { fromJson, getSqliteDb } from "@/server/db/sqlite";
import { ensureMissionControlFoundation } from "@/server/domain/bootstrap";

type WorkboardFilters = {
  owner?: string;
  status?: string;
  projectId?: string;
};

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

function mapHandoff(row: Record<string, unknown>): Handoff {
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

function mapTimeline(row: Record<string, unknown>): TimelineEvent {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    flowId: row.flow_id ? String(row.flow_id) : undefined,
    actor: String(row.actor),
    type: row.type as TimelineEvent["type"],
    summary: String(row.summary),
    payload: fromJson(row.payload_json as string | null, {}),
    createdAt: String(row.created_at),
  };
}

function mapProtocolReferences(value: string | null): ProtocolReference[] {
  const references = fromJson<Array<{ type?: string; id?: string }>>(value, []);
  return references
    .filter((reference) => typeof reference?.id === "string")
    .map((reference) => ({
      type: asProtocolReferenceType(reference.type ?? "task"),
      id: String(reference.id),
    }));
}

function mapCanonicalTransition(value: string | null): CanonicalTransition | undefined {
  const transition = fromJson<{ type?: string; id?: string; transition?: string } | null>(value, null);
  if (!transition?.id || !transition.transition) {
    return undefined;
  }

  return {
    type: asProtocolReferenceType(transition.type ?? "task"),
    id: String(transition.id),
    transition: String(transition.transition),
  };
}

function mapProtocolMessage(row: Record<string, unknown>): ProtocolMessage {
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
    references: mapProtocolReferences(row.references_json as string | null),
    statusNote: row.status_note ? String(row.status_note) : undefined,
    handledBy: row.handled_by ? String(row.handled_by) : undefined,
    handledAt: row.handled_at ? String(row.handled_at) : undefined,
    canonicalTransition: mapCanonicalTransition(row.canonical_transition_json as string | null),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapLaneLink(row: Record<string, unknown>): LaneLink {
  return {
    id: String(row.id),
    type: String(row.lane_type) as LaneLink["type"],
    label: String(row.label),
    externalId: String(row.external_id),
    taskId: row.task_id ? String(row.task_id) : undefined,
    flowId: row.flow_id ? String(row.flow_id) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function listWorkboardTasks(filters: WorkboardFilters = {}): TaskWorkboardItem[] {
  ensureMissionControlFoundation();
  const db = getSqliteDb();
  const rows = db.prepare("SELECT * FROM tasks ORDER BY updated_at DESC").all() as Record<string, unknown>[];

  return rows
    .map((row) => mapTask(row))
    .map((task) => {
      const flowStats = db
        .prepare(
          `
            SELECT
              COUNT(1) as flow_count,
              SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_flows
            FROM flows
            WHERE task_id = ?
          `,
        )
        .get(task.id) as { flow_count: number; blocked_flows: number | null };

      const pendingApprovals = db
        .prepare("SELECT COUNT(1) as count FROM approvals WHERE task_id = ? AND status = 'pending'")
        .get(task.id) as { count: number };

      return {
        id: task.id,
        title: task.title,
        owner: task.owner,
        status: task.status,
        priority: task.priority,
        updatedAt: task.updatedAt,
        linkedProjectIds: task.linkedProjects ?? [],
        flowCount: flowStats.flow_count ?? 0,
        blockedFlows: flowStats.blocked_flows ?? 0,
        pendingApprovals: pendingApprovals.count ?? 0,
      };
    })
    .filter((task) => (filters.owner ? task.owner === filters.owner : true))
    .filter((task) => (filters.status ? task.status === filters.status : true))
    .filter((task) => (filters.projectId ? task.linkedProjectIds.includes(filters.projectId) : true));
}

export function getTaskDetail(taskId: string): {
  task: Task;
  flows: Flow[];
  handoffs: Handoff[];
  approvals: Approval[];
  protocolMessages: ProtocolMessage[];
  lanes: LaneLink[];
  timeline: TimelineEvent[];
} | null {
  ensureMissionControlFoundation();
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  const flows = (db.prepare("SELECT * FROM flows WHERE task_id = ? ORDER BY created_at ASC").all(taskId) as Record<string, unknown>[]).map(mapFlow);
  const handoffs = (db.prepare("SELECT * FROM handoffs WHERE task_id = ? ORDER BY created_at DESC").all(taskId) as Record<string, unknown>[]).map(mapHandoff);
  const approvals = (db.prepare("SELECT * FROM approvals WHERE task_id = ? ORDER BY created_at DESC").all(taskId) as Record<string, unknown>[]).map(mapApproval);
  const protocolMessages = (
    db.prepare("SELECT * FROM protocol_messages WHERE task_id = ? ORDER BY updated_at DESC, created_at DESC").all(taskId) as Record<string, unknown>[]
  ).map(mapProtocolMessage);
  const lanes = (
    db.prepare("SELECT * FROM lane_links WHERE task_id = ? ORDER BY created_at DESC").all(taskId) as Record<string, unknown>[]
  ).map(mapLaneLink);
  const timeline = (
    db.prepare("SELECT * FROM timeline_events WHERE task_id = ? ORDER BY created_at DESC LIMIT 100").all(taskId) as Record<string, unknown>[]
  ).map(mapTimeline);

  return {
    task: mapTask(row),
    flows,
    handoffs,
    approvals,
    protocolMessages,
    lanes,
    timeline,
  };
}

export function listPendingApprovals() {
  ensureMissionControlFoundation();
  const db = getSqliteDb();

  const rows = db
    .prepare(
      `
        SELECT a.*, t.title as task_title
        FROM approvals a
        INNER JOIN tasks t ON t.id = a.task_id
        WHERE a.status = 'pending'
        ORDER BY a.created_at ASC
      `,
    )
    .all() as (Record<string, unknown> & { task_title: string })[];

  return rows.map((row) => ({
    approval: mapApproval(row),
    taskTitle: String(row.task_title),
    taskId: String(row.task_id),
  }));
}

export function listActiveProtocolExceptions(): ProtocolExceptionInboxItem[] {
  ensureMissionControlFoundation();
  const db = getSqliteDb();

  const rows = db
    .prepare(
      `
        SELECT pm.*, t.title as task_title, f.title as flow_title
        FROM protocol_messages pm
        INNER JOIN tasks t ON t.id = pm.task_id
        LEFT JOIN flows f ON f.id = pm.flow_id
        WHERE pm.status IN ('blocked', 'escalated')
        ORDER BY
          CASE pm.status
            WHEN 'escalated' THEN 0
            WHEN 'blocked' THEN 1
            ELSE 2
          END,
          pm.updated_at ASC
      `,
    )
    .all() as (Record<string, unknown> & { task_title: string; flow_title: string | null })[];

  return rows.map((row) => ({
    protocolMessage: mapProtocolMessage(row),
    taskId: String(row.task_id),
    taskTitle: String(row.task_title),
    flowTitle: row.flow_title ? String(row.flow_title) : undefined,
  }));
}

export function listProjects(): Project[] {
  ensureMissionControlFoundation();
  const db = getSqliteDb();
  const rows = db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Record<string, unknown>[];
  return rows.map((row) => {
    const projectId = String(row.id);
    const stats = db
      .prepare(
        `
          SELECT
            COUNT(1) as task_count,
            SUM(CASE WHEN status IN ('active', 'in_review', 'needs_approval') THEN 1 ELSE 0 END) as active_task_count,
            SUM(CASE WHEN status = 'needs_approval' THEN 1 ELSE 0 END) as pending_approval_count
          FROM tasks, json_each(tasks.linked_projects_json)
          WHERE json_each.value = ?
        `,
      )
      .get(projectId) as {
        task_count: number | null;
        active_task_count: number | null;
        pending_approval_count: number | null;
      };

    return {
      id: projectId,
      name: String(row.name),
      status: String(row.status) as Project["status"],
      githubRepo: row.github_repo ? String(row.github_repo) : undefined,
      githubDefaultBaseBranch: row.github_default_base_branch ? String(row.github_default_base_branch) : undefined,
      taskCount: stats.task_count ?? 0,
      activeTaskCount: stats.active_task_count ?? 0,
      pendingApprovalCount: stats.pending_approval_count ?? 0,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  });
}

export function getSettings(): Settings | null {
  ensureMissionControlFoundation();
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
