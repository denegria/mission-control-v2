import type {
  ApprovalStatus,
  ApprovalTargetType,
  AutonomyScope,
  FlowStatus,
  FlowType,
  GithubLinkType,
  HandoffStatus,
  LaneType,
  Priority,
  ProtocolMessageType,
  ProtocolReferenceType,
  ProtocolStatus,
  RunAdapter,
  RunStatus,
  RunTriggerSource,
  RiskCategory,
  TaskStatus,
} from "@/domain/schema/enums";

export type ID = string;
export type ISODateTime = string;

export type LinkedArtifact = {
  label: string;
  url: string;
};

export type LinkedGithubObject = {
  type: GithubLinkType;
  ref: string;
  title?: string;
  repo?: string;
  state?: string;
  url?: string;
};

export type LaneRef = {
  id: ID;
  type: LaneType;
  label: string;
  externalId: string;
};

export type LaneLink = LaneRef & {
  taskId?: ID;
  flowId?: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type Task = {
  id: ID;
  title: string;
  objective: string;
  requester: string;
  owner: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  acceptanceCriteria?: string[];
  dependencies?: ID[];
  linkedProjects?: ID[];
  linkedArtifacts?: LinkedArtifact[];
  linkedGithubObjects?: LinkedGithubObject[];
  tags?: string[];
  summary?: string;
};

export type Flow = {
  id: ID;
  taskId: ID;
  title: string;
  type: FlowType;
  owner: string;
  status: FlowStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  objective?: string;
  inputs?: string[];
  outputs?: string[];
  dependencies?: ID[];
  linkedLane?: LaneRef;
  linkedArtifacts?: LinkedArtifact[];
  linkedGithubObjects?: LinkedGithubObject[];
  summary?: string;
};

export type Handoff = {
  id: ID;
  taskId: ID;
  from: string;
  to: string;
  intent: string;
  expectedOutput: string;
  createdAt: ISODateTime;
  flowId?: ID;
  sourceFlowId?: ID;
  targetFlowId?: ID;
  constraints?: string[];
  evidence?: LinkedArtifact[];
  confidence?: number;
  openQuestions?: string[];
  status?: HandoffStatus;
};

export type Approval = {
  id: ID;
  targetType: ApprovalTargetType;
  targetId: ID;
  riskCategory: RiskCategory;
  requestedAction: string;
  requestedBy: string;
  status: ApprovalStatus;
  createdAt: ISODateTime;
  summary?: string;
  evidence?: LinkedArtifact[];
  decisionBy?: string;
  decisionReason?: string;
  expiresAt?: ISODateTime;
};

export type ProtocolReference = {
  type: ProtocolReferenceType;
  id: ID;
};

export type CanonicalTransition = {
  type: ProtocolReferenceType;
  id: ID;
  transition: string;
};

export type ProtocolMessage = {
  id: ID;
  taskId: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  type: ProtocolMessageType;
  from: string;
  to: string;
  summary: string;
  autonomyScope: AutonomyScope;
  status: ProtocolStatus;
  flowId?: ID;
  references?: ProtocolReference[];
  statusNote?: string;
  handledBy?: string;
  handledAt?: ISODateTime;
  canonicalTransition?: CanonicalTransition;
};

export type RunInputPayload = {
  prompt: string;
  flowTitle: string;
  flowObjective?: string;
  taskTitle: string;
  taskObjective: string;
  owner: string;
  actor: string;
};

export type RunResultPayload = {
  finalOutput: string;
  summary?: string;
  rawOutput?: string;
};

export type RunErrorPayload = {
  message: string;
  code?: string;
  retryable?: boolean;
  rawOutput?: string;
};

export type Run = {
  id: ID;
  taskId: ID;
  flowId: ID;
  status: RunStatus;
  adapter: RunAdapter;
  agent: string;
  requestedBy: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  inputPayload: RunInputPayload;
  approvedBy?: string;
  approvalId?: ID;
  triggerSource?: RunTriggerSource;
  parentRunId?: ID;
  startedAt?: ISODateTime;
  finishedAt?: ISODateTime;
  resultPayload?: RunResultPayload;
  errorPayload?: RunErrorPayload;
};

export type TimelineEventType =
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
  | "run_created"
  | "run_started"
  | "run_completed"
  | "run_failed"
  | "run_canceled"
  | "lane_linked"
  | "evidence_attached"
  | "protocol_message_emitted"
  | "protocol_message_status_changed";

export type TimelineEvent = {
  id: ID;
  taskId: ID;
  flowId?: ID;
  actor: string;
  type: TimelineEventType;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: ISODateTime;
};

export type Project = {
  id: ID;
  name: string;
  status: "active" | "planning" | "archived";
  githubRepo?: string;
  githubDefaultBaseBranch?: string;
  taskCount?: number;
  activeTaskCount?: number;
  pendingApprovalCount?: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type ActorOption = {
  id: string;
  label: string;
};

export type Settings = {
  id: "default";
  operators: {
    defaultOperatorId: string;
    defaultOperatorLabel: string;
    actorRoster: ActorOption[];
  };
  approvalDefaults: {
    autoApproveBelowRisk: "low" | "medium";
    requireApprovalFor: RiskCategory[];
  };
  riskDefaults: {
    destructiveThreshold: RiskCategory;
    externalCommunicationThreshold: RiskCategory;
  };
  display: {
    defaultWorkboardView: "kanban" | "list";
    showCompletedByDefault: boolean;
  };
  laneDefaults: {
    preferredImplementationLane: LaneType;
  };
  githubDefaults: {
    enableLinking: boolean;
    defaultRepo?: string;
    defaultBaseBranch?: string;
    issueCreationMode: "manual";
    pullRequestMode: "manual";
  };
  retention: {
    timelineRetentionDays: number;
  };
  updatedAt: ISODateTime;
};
