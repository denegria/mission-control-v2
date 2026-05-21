import type { Flow, LaneLink, LinkedGithubObject, Run, Task } from "@/domain/schema";

export type RunLifecycleStage = "candidate" | "finalist" | "validated" | "landed" | "blocked";
export type RunScorecardSource = "persisted" | "derived";
export type RunVerificationStatus = "not_requested" | "requested" | "passed" | "failed" | "blocked";

export type RunScorecard = {
  lifecycleStage: RunLifecycleStage;
  source: RunScorecardSource;
  durationLabel: string;
  validationSignals: string[];
  changedFileSignals: string[];
  reviewerSignals: string[];
  artifactSignals: string[];
  verificationStatus: RunVerificationStatus;
  verificationOwner?: string;
  closureOutcome?: string;
  closureSummary?: string;
  updatedAt?: string;
};

export type RunConsoleItem = {
  run: Run;
  task: Pick<Task, "id" | "title" | "status" | "priority" | "owner" | "updatedAt">;
  flow: Pick<Flow, "id" | "title" | "status" | "type" | "owner">;
  lane?: LaneLink;
  linkedGithubObjects: LinkedGithubObject[];
  scorecard: RunScorecard;
};
