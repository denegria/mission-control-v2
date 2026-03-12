import { randomUUID } from "node:crypto";
import type { Approval, Flow, Handoff, ProtocolMessage, Task, TimelineEvent } from "@/domain/schema";
import { asJson, getSqliteDb } from "@/server/db/sqlite";

type AggregateType = "task" | "flow" | "handoff" | "approval" | "timeline" | "lane" | "settings" | "project" | "protocol_message";

export type MissionControlEventType =
  | "task_created"
  | "task_updated"
  | "task_status_changed"
  | "task_owner_changed"
  | "flow_created"
  | "flow_updated"
  | "flow_status_changed"
  | "handoff_submitted"
  | "handoff_status_changed"
  | "approval_requested"
  | "approval_decided"
  | "lane_linked"
  | "protocol_message_emitted"
  | "protocol_message_status_changed";

export type MissionControlEvent = {
  id: string;
  aggregateType: AggregateType;
  aggregateId: string;
  taskId?: string;
  flowId?: string;
  type: MissionControlEventType;
  actor: string;
  payload: Record<string, unknown>;
  createdAt: string;
  timeline?: Omit<TimelineEvent, "id" | "taskId" | "createdAt">;
};

export function newEvent(input: Omit<MissionControlEvent, "id" | "createdAt">): MissionControlEvent {
  return {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
}

export function appendEvent(event: MissionControlEvent) {
  const db = getSqliteDb();
  db.prepare(
    `
      INSERT INTO event_log (id, aggregate_type, aggregate_id, task_id, flow_id, event_type, actor, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    event.id,
    event.aggregateType,
    event.aggregateId,
    event.taskId ?? null,
    event.flowId ?? null,
    event.type,
    event.actor,
    asJson(event.payload),
    event.createdAt,
  );
}

export function eventForTaskCreated(task: Task, actor: string): MissionControlEvent {
  return newEvent({
    aggregateType: "task",
    aggregateId: task.id,
    taskId: task.id,
    type: "task_created",
    actor,
    payload: { task },
    timeline: {
      actor,
      flowId: undefined,
      type: "task_created",
      summary: `Task created by ${actor}`,
      payload: { title: task.title, status: task.status },
    },
  });
}

export function eventForFlowCreated(flow: Flow, actor: string): MissionControlEvent {
  return newEvent({
    aggregateType: "flow",
    aggregateId: flow.id,
    taskId: flow.taskId,
    flowId: flow.id,
    type: "flow_created",
    actor,
    payload: { flow },
    timeline: {
      actor,
      flowId: flow.id,
      type: "flow_created",
      summary: `Flow ${flow.type} created`,
      payload: { title: flow.title, owner: flow.owner },
    },
  });
}

export function eventForHandoffSubmitted(handoff: Handoff, actor: string): MissionControlEvent {
  return newEvent({
    aggregateType: "handoff",
    aggregateId: handoff.id,
    taskId: handoff.taskId,
    flowId: handoff.flowId,
    type: "handoff_submitted",
    actor,
    payload: { handoff },
    timeline: {
      actor,
      flowId: handoff.flowId,
      type: "handoff_submitted",
      summary: `Handoff ${handoff.from} -> ${handoff.to}`,
      payload: { intent: handoff.intent },
    },
  });
}

export function eventForHandoffStatusChanged(handoff: Handoff, actor: string): MissionControlEvent {
  return newEvent({
    aggregateType: "handoff",
    aggregateId: handoff.id,
    taskId: handoff.taskId,
    flowId: handoff.flowId,
    type: "handoff_status_changed",
    actor,
    payload: { handoff },
    timeline: {
      actor,
      flowId: handoff.flowId,
      type: "handoff_status_changed",
      summary: `Handoff ${handoff.from} -> ${handoff.to} marked ${handoff.status ?? "open"}`,
      payload: { intent: handoff.intent, status: handoff.status ?? "open" },
    },
  });
}

export function eventForApprovalRequested(approval: Approval, taskId: string, actor: string): MissionControlEvent {
  return newEvent({
    aggregateType: "approval",
    aggregateId: approval.id,
    taskId,
    flowId: approval.targetType === "flow" ? approval.targetId : undefined,
    type: "approval_requested",
    actor,
    payload: { approval, taskId },
    timeline: {
      actor,
      flowId: approval.targetType === "flow" ? approval.targetId : undefined,
      type: "approval_requested",
      summary: `${approval.riskCategory} risk approval requested`,
      payload: { requestedAction: approval.requestedAction, status: approval.status },
    },
  });
}

export function eventForProtocolMessageEmitted(message: ProtocolMessage, actor: string): MissionControlEvent {
  return newEvent({
    aggregateType: "protocol_message",
    aggregateId: message.id,
    taskId: message.taskId,
    flowId: message.flowId,
    type: "protocol_message_emitted",
    actor,
    payload: { protocolMessage: message },
    timeline: {
      actor,
      flowId: message.flowId,
      type: "protocol_message_emitted",
      summary: `Protocol ${message.type.replaceAll("_", " ")}: ${message.summary}`,
      payload: {
        type: message.type,
        from: message.from,
        to: message.to,
        autonomyScope: message.autonomyScope,
        status: message.status,
      },
    },
  });
}

export function eventForProtocolMessageStatusChanged(input: {
  message: ProtocolMessage;
  actor: string;
  previousStatus: string;
}): MissionControlEvent {
  const { message, actor, previousStatus } = input;
  return newEvent({
    aggregateType: "protocol_message",
    aggregateId: message.id,
    taskId: message.taskId,
    flowId: message.flowId,
    type: "protocol_message_status_changed",
    actor,
    payload: { protocolMessage: message, previousStatus },
    timeline: {
      actor,
      flowId: message.flowId,
      type: "protocol_message_status_changed",
      summary: `Protocol ${message.type.replaceAll("_", " ")} marked ${message.status}`,
      payload: {
        type: message.type,
        previousStatus,
        status: message.status,
        statusNote: message.statusNote ?? null,
        canonicalTransition: message.canonicalTransition ?? null,
      },
    },
  });
}
