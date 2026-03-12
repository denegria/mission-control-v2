import { randomUUID } from "node:crypto";
import type { Approval, Flow, Handoff, ProtocolMessage, Settings, Task } from "@/domain/schema";
import { runMigrations } from "@/server/db/migrations";
import { asJson, getSqliteDb } from "@/server/db/sqlite";
import {
  appendEvent,
  eventForApprovalRequested,
  eventForFlowCreated,
  eventForHandoffSubmitted,
  eventForProtocolMessageEmitted,
  eventForProtocolMessageStatusChanged,
  eventForTaskCreated,
  newEvent,
} from "@/server/domain/events";
import { projectEvent } from "@/server/domain/projector";

let bootstrapped = false;

function projectAndAppend(event: ReturnType<typeof newEvent>) {
  appendEvent(event);
  projectEvent(event);
}

function seedDefaults() {
  const db = getSqliteDb();

  const settings = db.prepare("SELECT id FROM settings WHERE id = 'default'").get() as { id: string } | undefined;
  if (!settings) {
    const payload: Settings = {
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
      approvalDefaults: {
        autoApproveBelowRisk: "low",
        requireApprovalFor: ["high", "critical"],
      },
      riskDefaults: {
        destructiveThreshold: "high",
        externalCommunicationThreshold: "high",
      },
      display: {
        defaultWorkboardView: "kanban",
        showCompletedByDefault: false,
      },
      laneDefaults: {
        preferredImplementationLane: "openclaw_session",
      },
      githubDefaults: {
        enableLinking: true,
        defaultRepo: undefined,
        defaultBaseBranch: "main",
        issueCreationMode: "manual",
        pullRequestMode: "manual",
      },
      retention: {
        timelineRetentionDays: 180,
      },
      updatedAt: new Date().toISOString(),
    };

    db.prepare("INSERT INTO settings (id, payload_json, updated_at) VALUES (?, ?, ?)").run("default", asJson(payload), payload.updatedAt);
  }

  const hasProjects = db.prepare("SELECT COUNT(1) as count FROM projects").get() as { count: number };
  if (hasProjects.count === 0) {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO projects (id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(
      "project-mission-control",
      "Mission Control",
      "active",
      now,
      now,
    );
    db.prepare("UPDATE projects SET github_repo = ?, github_default_base_branch = ? WHERE id = ?").run(
      "mission-control-v2",
      "main",
      "project-mission-control",
    );
  }
}

function seedTaskFlowReviewPath() {
  const db = getSqliteDb();
  const hasEvents = db.prepare("SELECT COUNT(1) as count FROM event_log").get() as { count: number };
  if (hasEvents.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const taskId = randomUUID();
  const designFlowId = randomUUID();
  const implementationFlowId = randomUUID();
  const reviewFlowId = randomUUID();

  const task: Task = {
    id: taskId,
    title: "Mission Control Phase 1 foundation",
    objective: "Stand up core Task + Flow + Approval operations with event log and materialized state",
    requester: "Alvaro",
    owner: "Giuseppe",
    status: "needs_approval",
    priority: "high",
    createdAt: now,
    updatedAt: now,
    acceptanceCriteria: [
      "Workboard reads task state from SQLite",
      "Task Detail shows flows, handoffs, approvals, timeline from SQLite",
      "Design -> implementation -> review workflow represented as flows",
    ],
    linkedProjects: ["project-mission-control"],
    summary: "Phase 1 baseline task used as live reference data",
    tags: ["phase-1", "foundation"],
  };

  const designFlow: Flow = {
    id: designFlowId,
    taskId,
    title: "Design flow",
    type: "design",
    owner: "Cisco",
    status: "done",
    objective: "Finalize object model and backend shape",
    outputs: ["Task/Flow/Handoff/Approval model", "event log strategy"],
    createdAt: now,
    updatedAt: now,
    summary: "Design signed off for implementation",
  };

  const implementationFlow: Flow = {
    id: implementationFlowId,
    taskId,
    title: "Implementation flow",
    type: "implementation",
    owner: "Senior Builder",
    status: "in_review",
    objective: "Implement SQLite-backed event store and read models",
    linkedLane: {
      id: randomUUID(),
      type: "openclaw_session",
      label: "OpenClaw Session",
      externalId: "openclaw://mission-control-v2/session/phase1",
    },
    createdAt: now,
    updatedAt: now,
    summary: "Core foundation complete, pending review",
  };

  const reviewFlow: Flow = {
    id: reviewFlowId,
    taskId,
    title: "Review flow",
    type: "review",
    owner: "Sentry",
    status: "ready",
    objective: "Validate quality, evidence, and approval requirements",
    createdAt: now,
    updatedAt: now,
  };

  const handoff: Handoff = {
    id: randomUUID(),
    taskId,
    sourceFlowId: designFlowId,
    targetFlowId: implementationFlowId,
    flowId: implementationFlowId,
    from: "Cisco",
    to: "Senior Builder",
    intent: "Execute approved architecture",
    expectedOutput: "Working event log + state projector",
    constraints: ["No deep GitHub integration", "Keep scope Phase 1 only"],
    status: "accepted",
    createdAt: now,
  };

  const approval: Approval = {
    id: randomUUID(),
    targetType: "task",
    targetId: taskId,
    riskCategory: "high",
    requestedAction: "Approve production rollout of mission-control-v2 foundation",
    requestedBy: "Senior Builder",
    status: "pending",
    summary: "Infrastructure action affects live operating surface",
    createdAt: now,
  };

  const handoffProtocolMessage: ProtocolMessage = {
    id: randomUUID(),
    taskId,
    flowId: implementationFlowId,
    type: "handoff_submit",
    from: handoff.from,
    to: handoff.to,
    summary: handoff.intent,
    autonomyScope: "within_policy",
    status: "open",
    references: [
      { type: "handoff", id: handoff.id },
      { type: "flow", id: implementationFlowId },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const approvalProtocolMessage: ProtocolMessage = {
    id: randomUUID(),
    taskId,
    type: "approval_request",
    from: approval.requestedBy,
    to: "Approval Queue",
    summary: approval.requestedAction,
    autonomyScope: "approval_required",
    status: "open",
    references: [
      { type: "approval", id: approval.id },
      { type: "task", id: taskId },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const blockerProtocolMessage: ProtocolMessage = {
    id: randomUUID(),
    taskId,
    flowId: reviewFlowId,
    type: "blocker_raise",
    from: "Sentry",
    to: "Giuseppe",
    summary: "Review flow needs a human decision on rollout risk",
    autonomyScope: "escalate",
    status: "escalated",
    references: [{ type: "flow", id: reviewFlowId }],
    statusNote: "Approval evidence is incomplete for a production-facing rollout.",
    handledBy: "Giuseppe",
    handledAt: now,
    createdAt: now,
    updatedAt: now,
  };

  projectAndAppend(eventForTaskCreated(task, "Giuseppe"));
  projectAndAppend(eventForFlowCreated(designFlow, "Cisco"));
  projectAndAppend(eventForFlowCreated(implementationFlow, "Senior Builder"));
  projectAndAppend(eventForFlowCreated(reviewFlow, "Sentry"));
  projectAndAppend(eventForHandoffSubmitted(handoff, "Cisco"));
  projectAndAppend(eventForApprovalRequested(approval, taskId, "Senior Builder"));
  projectAndAppend(eventForProtocolMessageEmitted(handoffProtocolMessage, handoff.from));
  projectAndAppend(eventForProtocolMessageEmitted(approvalProtocolMessage, approval.requestedBy));
  projectAndAppend(eventForProtocolMessageEmitted({ ...blockerProtocolMessage, status: "open", statusNote: undefined, handledBy: undefined, handledAt: undefined }, "Sentry"));
  projectAndAppend(
    eventForProtocolMessageStatusChanged({
      message: blockerProtocolMessage,
      actor: "Giuseppe",
      previousStatus: "open",
    }),
  );

  if (implementationFlow.linkedLane) {
    projectAndAppend(
      newEvent({
        aggregateType: "lane",
        aggregateId: implementationFlow.linkedLane.id,
        taskId,
        flowId: implementationFlowId,
        type: "lane_linked",
        actor: "Senior Builder",
        payload: { lane: implementationFlow.linkedLane },
        timeline: {
          actor: "Senior Builder",
          flowId: implementationFlowId,
          type: "lane_linked",
          summary: `Lane linked: ${implementationFlow.linkedLane.label}`,
          payload: { laneType: implementationFlow.linkedLane.type, externalId: implementationFlow.linkedLane.externalId },
        },
      }),
    );
  }
}

export function ensureMissionControlFoundation() {
  if (bootstrapped) {
    return;
  }

  runMigrations();
  seedDefaults();
  seedTaskFlowReviewPath();
  bootstrapped = true;
}
