import { randomUUID } from "node:crypto";
import type { Approval, Flow, Handoff, ProtocolMessage, Run, Task } from "@/domain/schema";
import { asJson, getSqliteDb } from "@/server/db/sqlite";
import type { MissionControlEvent } from "@/server/domain/events";

function upsertTask(task: Task) {
  const db = getSqliteDb();
  db.prepare(
    `
      INSERT INTO tasks (
        id, title, objective, requester, owner, status, priority, acceptance_criteria_json, dependencies_json,
        linked_projects_json, linked_artifacts_json, linked_github_objects_json, tags_json, summary, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        objective=excluded.objective,
        requester=excluded.requester,
        owner=excluded.owner,
        status=excluded.status,
        priority=excluded.priority,
        acceptance_criteria_json=excluded.acceptance_criteria_json,
        dependencies_json=excluded.dependencies_json,
        linked_projects_json=excluded.linked_projects_json,
        linked_artifacts_json=excluded.linked_artifacts_json,
        linked_github_objects_json=excluded.linked_github_objects_json,
        tags_json=excluded.tags_json,
        summary=excluded.summary,
        updated_at=excluded.updated_at
    `,
  ).run(
    task.id,
    task.title,
    task.objective,
    task.requester,
    task.owner,
    task.status,
    task.priority,
    asJson(task.acceptanceCriteria ?? []),
    asJson(task.dependencies ?? []),
    asJson(task.linkedProjects ?? []),
    asJson(task.linkedArtifacts ?? []),
    asJson(task.linkedGithubObjects ?? []),
    asJson(task.tags ?? []),
    task.summary ?? null,
    task.createdAt,
    task.updatedAt,
  );
}

function upsertFlow(flow: Flow) {
  const db = getSqliteDb();
  db.prepare(
    `
      INSERT INTO flows (
        id, task_id, title, type, owner, status, objective, inputs_json, outputs_json, dependencies_json, linked_lane_json,
        linked_artifacts_json, linked_github_objects_json, summary, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        task_id=excluded.task_id,
        title=excluded.title,
        type=excluded.type,
        owner=excluded.owner,
        status=excluded.status,
        objective=excluded.objective,
        inputs_json=excluded.inputs_json,
        outputs_json=excluded.outputs_json,
        dependencies_json=excluded.dependencies_json,
        linked_lane_json=excluded.linked_lane_json,
        linked_artifacts_json=excluded.linked_artifacts_json,
        linked_github_objects_json=excluded.linked_github_objects_json,
        summary=excluded.summary,
        updated_at=excluded.updated_at
    `,
  ).run(
    flow.id,
    flow.taskId,
    flow.title,
    flow.type,
    flow.owner,
    flow.status,
    flow.objective ?? null,
    asJson(flow.inputs ?? []),
    asJson(flow.outputs ?? []),
    asJson(flow.dependencies ?? []),
    asJson(flow.linkedLane ?? null),
    asJson(flow.linkedArtifacts ?? []),
    asJson(flow.linkedGithubObjects ?? []),
    flow.summary ?? null,
    flow.createdAt,
    flow.updatedAt,
  );
}

function upsertHandoff(handoff: Handoff) {
  const db = getSqliteDb();
  db.prepare(
    `
      INSERT INTO handoffs (
        id, task_id, flow_id, source_flow_id, target_flow_id, from_actor, to_actor, intent, expected_output,
        constraints_json, evidence_json, confidence, open_questions_json, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        flow_id=excluded.flow_id,
        source_flow_id=excluded.source_flow_id,
        target_flow_id=excluded.target_flow_id,
        from_actor=excluded.from_actor,
        to_actor=excluded.to_actor,
        intent=excluded.intent,
        expected_output=excluded.expected_output,
        constraints_json=excluded.constraints_json,
        evidence_json=excluded.evidence_json,
        confidence=excluded.confidence,
        open_questions_json=excluded.open_questions_json,
        status=excluded.status
    `,
  ).run(
    handoff.id,
    handoff.taskId,
    handoff.flowId ?? null,
    handoff.sourceFlowId ?? null,
    handoff.targetFlowId ?? null,
    handoff.from,
    handoff.to,
    handoff.intent,
    handoff.expectedOutput,
    asJson(handoff.constraints ?? []),
    asJson(handoff.evidence ?? []),
    handoff.confidence ?? null,
    asJson(handoff.openQuestions ?? []),
    handoff.status ?? "open",
    handoff.createdAt,
  );
}

function upsertApproval(approval: Approval, taskId: string) {
  const db = getSqliteDb();
  db.prepare(
    `
      INSERT INTO approvals (
        id, target_type, target_id, task_id, risk_category, requested_action, requested_by, status, summary, evidence_json,
        decision_by, decision_reason, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        summary=excluded.summary,
        evidence_json=excluded.evidence_json,
        decision_by=excluded.decision_by,
        decision_reason=excluded.decision_reason,
        expires_at=excluded.expires_at
    `,
  ).run(
    approval.id,
    approval.targetType,
    approval.targetId,
    taskId,
    approval.riskCategory,
    approval.requestedAction,
    approval.requestedBy,
    approval.status,
    approval.summary ?? null,
    asJson(approval.evidence ?? []),
    approval.decisionBy ?? null,
    approval.decisionReason ?? null,
    approval.expiresAt ?? null,
    approval.createdAt,
  );
}

function upsertProtocolMessage(message: ProtocolMessage) {
  const db = getSqliteDb();
  db.prepare(
    `
      INSERT INTO protocol_messages (
        id, task_id, flow_id, message_type, from_actor, to_actor, summary, autonomy_scope, status, references_json,
        status_note, handled_by, handled_at, canonical_transition_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        flow_id=excluded.flow_id,
        message_type=excluded.message_type,
        from_actor=excluded.from_actor,
        to_actor=excluded.to_actor,
        summary=excluded.summary,
        autonomy_scope=excluded.autonomy_scope,
        status=excluded.status,
        references_json=excluded.references_json,
        status_note=excluded.status_note,
        handled_by=excluded.handled_by,
        handled_at=excluded.handled_at,
        canonical_transition_json=excluded.canonical_transition_json,
        updated_at=excluded.updated_at
    `,
  ).run(
    message.id,
    message.taskId,
    message.flowId ?? null,
    message.type,
    message.from,
    message.to,
    message.summary,
    message.autonomyScope,
    message.status,
    asJson(message.references ?? []),
    message.statusNote ?? null,
    message.handledBy ?? null,
    message.handledAt ?? null,
    asJson(message.canonicalTransition ?? null),
    message.createdAt,
    message.updatedAt,
  );
}

function upsertRun(run: Run) {
  const db = getSqliteDb();
  db.prepare(
    `
      INSERT INTO runs (
        id, task_id, flow_id, status, adapter, agent, requested_by, approved_by, approval_id, trigger_source, parent_run_id,
        input_payload_json, result_payload_json, error_payload_json, started_at, finished_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        task_id=excluded.task_id,
        flow_id=excluded.flow_id,
        status=excluded.status,
        adapter=excluded.adapter,
        agent=excluded.agent,
        requested_by=excluded.requested_by,
        approved_by=excluded.approved_by,
        approval_id=excluded.approval_id,
        trigger_source=excluded.trigger_source,
        parent_run_id=excluded.parent_run_id,
        input_payload_json=excluded.input_payload_json,
        result_payload_json=excluded.result_payload_json,
        error_payload_json=excluded.error_payload_json,
        started_at=excluded.started_at,
        finished_at=excluded.finished_at,
        updated_at=excluded.updated_at
    `,
  ).run(
    run.id,
    run.taskId,
    run.flowId,
    run.status,
    run.adapter,
    run.agent,
    run.requestedBy,
    run.approvedBy ?? null,
    run.approvalId ?? null,
    run.triggerSource ?? null,
    run.parentRunId ?? null,
    asJson(run.inputPayload),
    asJson(run.resultPayload ?? null),
    asJson(run.errorPayload ?? null),
    run.startedAt ?? null,
    run.finishedAt ?? null,
    run.createdAt,
    run.updatedAt,
  );
}

function writeTimeline(event: MissionControlEvent) {
  if (!event.taskId) {
    return;
  }
  const timeline = event.timeline ?? {
    actor: event.actor,
    flowId: event.flowId,
    type: event.type,
    summary: event.type,
    payload: event.payload,
  };
  const db = getSqliteDb();
  db.prepare(
    `
      INSERT INTO timeline_events (id, task_id, flow_id, actor, type, summary, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(randomUUID(), event.taskId, timeline.flowId ?? null, timeline.actor, timeline.type, timeline.summary, asJson(timeline.payload), event.createdAt);
}

export function projectEvent(event: MissionControlEvent) {
  switch (event.type) {
    case "task_created":
    case "task_updated":
    case "task_status_changed":
    case "task_owner_changed": {
      const task = event.payload.task as Task | undefined;
      if (task) {
        upsertTask(task);
      }
      break;
    }
    case "flow_created":
    case "flow_updated":
    case "flow_status_changed": {
      const flow = event.payload.flow as Flow | undefined;
      if (flow) {
        upsertFlow(flow);
      }
      break;
    }
    case "handoff_submitted":
    case "handoff_status_changed": {
      const handoff = event.payload.handoff as Handoff | undefined;
      if (handoff) {
        upsertHandoff(handoff);
      }
      break;
    }
    case "approval_requested":
    case "approval_decided": {
      const approval = event.payload.approval as Approval | undefined;
      const taskId = (event.payload.taskId as string | undefined) ?? event.taskId;
      if (approval && taskId) {
        upsertApproval(approval, taskId);
      }
      break;
    }
    case "run_created":
    case "run_started":
    case "run_completed":
    case "run_failed":
    case "run_canceled": {
      const run = event.payload.run as Run | undefined;
      if (run) {
        upsertRun(run);
      }
      break;
    }
    case "lane_linked": {
      const lane = event.payload.lane as { id: string; type: string; label: string; externalId: string } | undefined;
      if (lane) {
        const db = getSqliteDb();
        db.prepare(
          `
            INSERT INTO lane_links (id, lane_type, label, external_id, task_id, flow_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              lane_type=excluded.lane_type,
              label=excluded.label,
              external_id=excluded.external_id,
              task_id=excluded.task_id,
              flow_id=excluded.flow_id,
              updated_at=excluded.updated_at
          `,
        ).run(lane.id, lane.type, lane.label, lane.externalId, event.taskId ?? null, event.flowId ?? null, event.createdAt, event.createdAt);
      }
      break;
    }
    case "protocol_message_emitted":
    case "protocol_message_status_changed": {
      const protocolMessage = event.payload.protocolMessage as ProtocolMessage | undefined;
      if (protocolMessage) {
        upsertProtocolMessage(protocolMessage);
      }
      break;
    }
  }

  writeTimeline(event);
}
