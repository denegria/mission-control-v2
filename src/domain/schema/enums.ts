export const TASK_STATUSES = [
  "drafted",
  "ready",
  "active",
  "blocked",
  "in_review",
  "needs_approval",
  "completed",
  "rejected",
  "superseded",
  "archived",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const FLOW_TYPES = ["design", "implementation", "review", "qa", "copy", "deployment", "other"] as const;
export type FlowType = (typeof FLOW_TYPES)[number];

export const FLOW_STATUSES = [
  "drafted",
  "ready",
  "active",
  "blocked",
  "handed_off",
  "validating",
  "in_review",
  "approved",
  "done",
  "superseded",
] as const;

export type FlowStatus = (typeof FLOW_STATUSES)[number];

export const APPROVAL_STATUSES = ["not_required", "pending", "approved", "rejected", "expired", "superseded"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_TARGET_TYPES = ["task", "flow"] as const;
export type ApprovalTargetType = (typeof APPROVAL_TARGET_TYPES)[number];

export const RISK_CATEGORIES = ["low", "medium", "high", "critical"] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const HANDOFF_STATUSES = ["open", "accepted", "completed", "cancelled"] as const;
export type HandoffStatus = (typeof HANDOFF_STATUSES)[number];

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const LANE_TYPES = ["telegram_topic", "openclaw_session", "acp_session"] as const;
export type LaneType = (typeof LANE_TYPES)[number];

export const GITHUB_LINK_TYPES = ["issue", "pull_request", "branch", "commit", "check_run", "review", "other"] as const;
export type GithubLinkType = (typeof GITHUB_LINK_TYPES)[number];

export const PROTOCOL_MESSAGE_TYPES = [
  "handoff_submit",
  "approval_request",
  "blocker_raise",
  "completion_submit",
  "escalation_raise",
  "review_submit",
] as const;
export type ProtocolMessageType = (typeof PROTOCOL_MESSAGE_TYPES)[number];

export const PROTOCOL_STATUSES = ["open", "acknowledged", "blocked", "escalated", "resolved"] as const;
export type ProtocolStatus = (typeof PROTOCOL_STATUSES)[number];

export const AUTONOMY_SCOPES = ["within_policy", "approval_required", "escalate"] as const;
export type AutonomyScope = (typeof AUTONOMY_SCOPES)[number];

export const PROTOCOL_REFERENCE_TYPES = ["task", "flow", "handoff", "approval"] as const;
export type ProtocolReferenceType = (typeof PROTOCOL_REFERENCE_TYPES)[number];
