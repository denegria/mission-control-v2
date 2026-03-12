import {
  APPROVAL_STATUSES,
  APPROVAL_TARGET_TYPES,
  FLOW_STATUSES,
  FLOW_TYPES,
  GITHUB_LINK_TYPES,
  HANDOFF_STATUSES,
  LANE_TYPES,
  PROTOCOL_MESSAGE_TYPES,
  PROTOCOL_REFERENCE_TYPES,
  PROTOCOL_STATUSES,
  RUN_ADAPTERS,
  RUN_STATUSES,
  RUN_TRIGGER_SOURCES,
  PRIORITIES,
  RISK_CATEGORIES,
  TASK_STATUSES,
  AUTONOMY_SCOPES,
  type ApprovalStatus,
  type ApprovalTargetType,
  type AutonomyScope,
  type FlowStatus,
  type FlowType,
  type GithubLinkType,
  type HandoffStatus,
  type LaneType,
  type Priority,
  type ProtocolMessageType,
  type ProtocolReferenceType,
  type ProtocolStatus,
  type RunAdapter,
  type RunStatus,
  type RunTriggerSource,
  type RiskCategory,
  type TaskStatus,
} from "@/domain/schema/enums";

function hasValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

export function asTaskStatus(value: string): TaskStatus {
  return hasValue(TASK_STATUSES, value) ? value : "drafted";
}

export function asFlowType(value: string): FlowType {
  return hasValue(FLOW_TYPES, value) ? value : "other";
}

export function asFlowStatus(value: string): FlowStatus {
  return hasValue(FLOW_STATUSES, value) ? value : "drafted";
}

export function asPriority(value: string): Priority {
  return hasValue(PRIORITIES, value) ? value : "normal";
}

export function asApprovalStatus(value: string): ApprovalStatus {
  return hasValue(APPROVAL_STATUSES, value) ? value : "pending";
}

export function asApprovalTargetType(value: string): ApprovalTargetType {
  return hasValue(APPROVAL_TARGET_TYPES, value) ? value : "task";
}

export function asRiskCategory(value: string): RiskCategory {
  return hasValue(RISK_CATEGORIES, value) ? value : "medium";
}

export function asHandoffStatus(value: string): HandoffStatus {
  return hasValue(HANDOFF_STATUSES, value) ? value : "open";
}

export function asLaneType(value: string): LaneType {
  return hasValue(LANE_TYPES, value) ? value : "openclaw_session";
}

export function asGithubLinkType(value: string): GithubLinkType {
  return hasValue(GITHUB_LINK_TYPES, value) ? value : "other";
}

export function asProtocolMessageType(value: string): ProtocolMessageType {
  return hasValue(PROTOCOL_MESSAGE_TYPES, value) ? value : "handoff_submit";
}

export function asProtocolStatus(value: string): ProtocolStatus {
  return hasValue(PROTOCOL_STATUSES, value) ? value : "open";
}

export function asAutonomyScope(value: string): AutonomyScope {
  return hasValue(AUTONOMY_SCOPES, value) ? value : "within_policy";
}

export function asProtocolReferenceType(value: string): ProtocolReferenceType {
  return hasValue(PROTOCOL_REFERENCE_TYPES, value) ? value : "task";
}

export function asRunStatus(value: string): RunStatus {
  return hasValue(RUN_STATUSES, value) ? value : "queued";
}

export function asRunAdapter(value: string): RunAdapter {
  return hasValue(RUN_ADAPTERS, value) ? value : "acpx_codex";
}

export function asRunTriggerSource(value: string): RunTriggerSource {
  return hasValue(RUN_TRIGGER_SOURCES, value) ? value : "manual_dispatch";
}
