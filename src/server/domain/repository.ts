import type { Approval, CanonicalTransition, Flow, Handoff, LaneLink, LinkedGithubObject, Project, ProtocolMessage, ProtocolReference, Run, RunErrorPayload, RunInputPayload, RunResultPayload, Settings, Task, TimelineEvent } from "@/domain/schema";
import {
  asApprovalStatus,
  asApprovalTargetType,
  asAutonomyScope,
  asFlowStatus,
  asFlowType,
  asHandoffStatus,
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
import type { ProtocolExceptionInboxItem, TaskWorkboardItem } from "@/domain/tasks";
import type { RunConsoleItem, RunLifecycleStage, RunScorecard } from "@/domain/runs";
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
    workerLink:
      row.worker_session_key || row.worker_session_id || row.worker_resume_session_id
        ? {
            sessionKey: row.worker_session_key ? String(row.worker_session_key) : undefined,
            sessionId: row.worker_session_id ? String(row.worker_session_id) : undefined,
            resumeSessionId: row.worker_resume_session_id ? String(row.worker_resume_session_id) : undefined,
          }
        : undefined,
    resultPayload: fromJson<RunResultPayload | null>(row.result_payload_json as string | null, null) ?? undefined,
    errorPayload: fromJson<RunErrorPayload | null>(row.error_payload_json as string | null, null) ?? undefined,
    startedAt: row.started_at ? String(row.started_at) : undefined,
    finishedAt: row.finished_at ? String(row.finished_at) : undefined,
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

function textSignals(...values: Array<string | undefined>) {
  const text = values.filter(Boolean).join("\n").toLowerCase();
  return {
    matchLines: (patterns: RegExp[], fallback: string) => {
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const matches = lines.filter((line) => patterns.some((pattern) => pattern.test(line))).slice(0, 4);
      return matches.length > 0 ? matches : [fallback];
    },
  };
}

function extractClosure(finalOutput?: string) {
  if (!finalOutput) {
    return {};
  }

  const outcome = finalOutput.match(/(?:^|\n)outcome:\s*([^\n]+)/i)?.[1]?.trim();
  const summary = finalOutput.match(/(?:^|\n)summary:\s*([^\n]+)/i)?.[1]?.trim();
  return {
    closureOutcome: outcome,
    closureSummary: summary,
  };
}

function formatDuration(startedAt?: string, finishedAt?: string) {
  if (!startedAt) {
    return "Not started";
  }

  const endMs = finishedAt ? Date.parse(finishedAt) : Date.now();
  const deltaSeconds = Math.max(0, Math.round((endMs - Date.parse(startedAt)) / 1000));
  if (deltaSeconds < 60) {
    return `${deltaSeconds}s`;
  }

  const minutes = Math.floor(deltaSeconds / 60);
  const seconds = deltaSeconds % 60;
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function computeLifecycleStage(run: Run, githubObjects: LinkedGithubObject[], evidenceText: string): RunLifecycleStage {
  if (run.status === "failed" || run.status === "canceled") {
    return "blocked";
  }

  const hasCommit = githubObjects.some((item) => item.type === "commit") || /\bcommit\b|sha\b/.test(evidenceText);
  const hasValidation = /validation|validated|lint|build|test|passed|pass\b/.test(evidenceText);
  const hasLanded = githubObjects.some((item) => item.type === "pull_request" && item.state?.toLowerCase() === "merged") || /landed|merged|pushed|deployed/.test(evidenceText);

  if (hasLanded) {
    return "landed";
  }
  if (hasValidation) {
    return "validated";
  }
  if (hasCommit) {
    return "finalist";
  }
  return "candidate";
}

function buildRunScorecard(run: Run, githubObjects: LinkedGithubObject[]): RunScorecard {
  const outputText = [run.resultPayload?.summary, run.resultPayload?.finalOutput, run.resultPayload?.rawOutput, run.errorPayload?.message, run.errorPayload?.rawOutput].filter(Boolean).join("\n");
  const signals = textSignals(outputText);
  const closure = extractClosure(run.resultPayload?.finalOutput);
  const lifecycleStage = computeLifecycleStage(run, githubObjects, outputText.toLowerCase());

  return {
    lifecycleStage,
    durationLabel: formatDuration(run.startedAt, run.finishedAt),
    validationSignals: signals.matchLines([/\bnpm run\b/, /\blint\b/, /\bbuild\b/, /\btest\b/, /\bvalidate/, /\bpassed\b/, /\bfailed\b/], "No validation evidence captured"),
    changedFileSignals: signals.matchLines([/\bsrc\//, /\bapp\//, /\blib\//, /\bserver\//, /\bcomponents\//, /\bchanged files?\b/], "No changed-file signal captured"),
    reviewerSignals: signals.matchLines([/\bsentry\b/, /\btitan\b/, /\breview\b/, /\bqa\b/, /\bapproval\b/], "No reviewer signal captured"),
    artifactSignals:
      githubObjects.length > 0
        ? githubObjects.slice(0, 4).map((item) => `${item.type.replaceAll("_", " ")}: ${item.ref}`)
        : signals.matchLines([/\bbranch\b/, /\bcommit\b/, /\bsha\b/, /\bpr\b/, /\bpull request\b/], "No branch/commit artifact captured"),
    ...closure,
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
  runs: Run[];
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
  const runs = (db.prepare("SELECT * FROM runs WHERE task_id = ? ORDER BY created_at DESC").all(taskId) as Record<string, unknown>[]).map(mapRun);
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
    runs,
    protocolMessages,
    lanes,
    timeline,
  };
}

export function getRun(runId: string): Run | null {
  ensureMissionControlFoundation();
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM runs WHERE id = ?").get(runId) as Record<string, unknown> | undefined;
  return row ? mapRun(row) : null;
}

export function listRunsForFlow(flowId: string): Run[] {
  ensureMissionControlFoundation();
  const db = getSqliteDb();
  const rows = db.prepare("SELECT * FROM runs WHERE flow_id = ? ORDER BY created_at DESC").all(flowId) as Record<string, unknown>[];
  return rows.map(mapRun);
}

export function listRunConsoleItems(limit = 50): RunConsoleItem[] {
  ensureMissionControlFoundation();
  const db = getSqliteDb();
  const rows = db
    .prepare(
      `
        SELECT
          r.*,
          t.title as task_title,
          t.status as task_status,
          t.priority as task_priority,
          t.owner as task_owner,
          t.updated_at as task_updated_at,
          t.linked_github_objects_json as task_github_json,
          f.title as flow_title,
          f.status as flow_status,
          f.type as flow_type,
          f.owner as flow_owner,
          f.linked_github_objects_json as flow_github_json,
          l.id as lane_id,
          l.lane_type as lane_type,
          l.label as lane_label,
          l.external_id as lane_external_id,
          l.task_id as lane_task_id,
          l.flow_id as lane_flow_id,
          l.created_at as lane_created_at,
          l.updated_at as lane_updated_at
        FROM runs r
        INNER JOIN tasks t ON t.id = r.task_id
        INNER JOIN flows f ON f.id = r.flow_id
        LEFT JOIN lane_links l ON l.flow_id = r.flow_id OR (l.flow_id IS NULL AND l.task_id = r.task_id)
        ORDER BY
          CASE r.status
            WHEN 'running' THEN 0
            WHEN 'queued' THEN 1
            WHEN 'failed' THEN 2
            WHEN 'completed' THEN 3
            ELSE 4
          END,
          r.updated_at DESC
        LIMIT ?
      `,
    )
    .all(limit) as Record<string, unknown>[];

  return rows.map((row) => {
    const run = mapRun(row);
    const linkedGithubObjects = [
      ...fromJson<LinkedGithubObject[]>(row.task_github_json as string | null, []),
      ...fromJson<LinkedGithubObject[]>(row.flow_github_json as string | null, []),
    ];

    const lane =
      row.lane_id && row.lane_type && row.lane_label && row.lane_external_id
        ? mapLaneLink({
            id: row.lane_id,
            lane_type: row.lane_type,
            label: row.lane_label,
            external_id: row.lane_external_id,
            task_id: row.lane_task_id,
            flow_id: row.lane_flow_id,
            created_at: row.lane_created_at,
            updated_at: row.lane_updated_at,
          })
        : undefined;

    return {
      run,
      task: {
        id: run.taskId,
        title: String(row.task_title),
        status: asTaskStatus(String(row.task_status)),
        priority: asPriority(String(row.task_priority)),
        owner: String(row.task_owner),
        updatedAt: String(row.task_updated_at),
      },
      flow: {
        id: run.flowId,
        title: String(row.flow_title),
        status: asFlowStatus(String(row.flow_status)),
        type: asFlowType(String(row.flow_type)),
        owner: String(row.flow_owner),
      },
      lane,
      linkedGithubObjects,
      scorecard: buildRunScorecard(run, linkedGithubObjects),
    };
  });
}

export function getActiveRunForFlow(flowId: string): Run | null {
  ensureMissionControlFoundation();
  const db = getSqliteDb();
  const row = db
    .prepare("SELECT * FROM runs WHERE flow_id = ? AND status IN ('queued', 'running') ORDER BY created_at DESC LIMIT 1")
    .get(flowId) as Record<string, unknown> | undefined;
  return row ? mapRun(row) : null;
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
