import type { LinkedGithubObject, Run } from "@/domain/schema";
import type { RunLifecycleStage, RunScorecard, RunVerificationStatus } from "@/domain/runs";
import { asJson, fromJson, getSqliteDb } from "@/server/db/sqlite";

type PersistedRunScorecard = Omit<RunScorecard, "durationLabel" | "source">;

function linesFromText(...values: Array<string | undefined>) {
  return values
    .filter(Boolean)
    .join("\n")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function textSignals(...values: Array<string | undefined>) {
  const lines = linesFromText(...values);
  const lowerLines = lines.map((line) => line.toLowerCase());
  return {
    matchLines: (patterns: RegExp[], fallback: string) => {
      const matches = lowerLines.filter((line) => patterns.some((pattern) => pattern.test(line))).slice(0, 4);
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

function extractSection(raw: string, label: string) {
  const pattern = new RegExp(`(?:^|\\n)${label}:\\s*\\n([\\s\\S]*?)(?=\\n[a-z_ ]+:\\s*\\n|\\nCLOSURE:|$)`, "i");
  const match = raw.match(pattern)?.[1];
  if (!match) {
    return [];
  }

  return match
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line && !/^none$/i.test(line))
    .slice(0, 6);
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

function computeVerificationStatus(run: Run, evidenceText: string, closureOutcome?: string): RunVerificationStatus {
  if (run.status === "failed" || run.status === "canceled" || closureOutcome === "blocked") {
    return "blocked";
  }
  if (/\bverification failed\b|\bqa failed\b|\breview failed\b/.test(evidenceText)) {
    return "failed";
  }
  if (/\bverified\b|\bverification passed\b|\bqa passed\b|\breview approved\b/.test(evidenceText)) {
    return "passed";
  }
  if (closureOutcome === "done" || closureOutcome === "review") {
    return "requested";
  }
  return "not_requested";
}

function normalizeSignals(items: string[], fallback: string) {
  const filtered = items.map((item) => item.trim()).filter(Boolean);
  return filtered.length > 0 ? filtered.slice(0, 6) : [fallback];
}

export function formatRunDuration(startedAt?: string, finishedAt?: string) {
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

export function buildRunScorecard(run: Run, githubObjects: LinkedGithubObject[], persisted?: PersistedRunScorecard | null): RunScorecard {
  if (persisted) {
    return {
      ...persisted,
      source: "persisted",
      durationLabel: formatRunDuration(run.startedAt, run.finishedAt),
    };
  }

  const outputText = [run.resultPayload?.summary, run.resultPayload?.finalOutput, run.resultPayload?.rawOutput, run.errorPayload?.message, run.errorPayload?.rawOutput].filter(Boolean).join("\n");
  const signals = textSignals(outputText);
  const closure = extractClosure(run.resultPayload?.finalOutput);
  const closureOutcome = closure.closureOutcome?.toLowerCase();
  const lifecycleStage = computeLifecycleStage(run, githubObjects, outputText.toLowerCase());

  return {
    lifecycleStage,
    source: "derived",
    durationLabel: formatRunDuration(run.startedAt, run.finishedAt),
    validationSignals: signals.matchLines([/\bnpm run\b/, /\blint\b/, /\bbuild\b/, /\btest\b/, /\bvalidate/, /\bpassed\b/, /\bfailed\b/], "No validation evidence captured"),
    changedFileSignals: signals.matchLines([/\bsrc\//, /\bapp\//, /\blib\//, /\bserver\//, /\bcomponents\//, /\bchanged files?\b/], "No changed-file signal captured"),
    reviewerSignals: signals.matchLines([/\bsentry\b/, /\btitan\b/, /\breview\b/, /\bqa\b/, /\bapproval\b/], "No reviewer signal captured"),
    artifactSignals:
      githubObjects.length > 0
        ? githubObjects.slice(0, 4).map((item) => `${item.type.replaceAll("_", " ")}: ${item.ref}`)
        : signals.matchLines([/\bbranch\b/, /\bcommit\b/, /\bsha\b/, /\bpr\b/, /\bpull request\b/], "No branch/commit artifact captured"),
    verificationStatus: computeVerificationStatus(run, outputText.toLowerCase(), closureOutcome),
    verificationOwner: closureOutcome === "done" || closureOutcome === "review" ? "Sentry" : undefined,
    ...closure,
  };
}

export function extractRunScorecard(run: Run, githubObjects: LinkedGithubObject[] = []): PersistedRunScorecard {
  const raw = [run.resultPayload?.summary, run.resultPayload?.finalOutput, run.resultPayload?.rawOutput, run.errorPayload?.message, run.errorPayload?.rawOutput].filter(Boolean).join("\n");
  const lower = raw.toLowerCase();
  const signals = textSignals(raw);
  const closure = extractClosure(run.resultPayload?.finalOutput);
  const closureOutcome = closure.closureOutcome?.toLowerCase();
  const scorecardValidation = extractSection(raw, "validation");
  const scorecardChangedFiles = extractSection(raw, "changed_files");
  const scorecardReview = extractSection(raw, "review");
  const scorecardArtifacts = extractSection(raw, "artifacts");

  return {
    lifecycleStage: computeLifecycleStage(run, githubObjects, lower),
    validationSignals: normalizeSignals(
      scorecardValidation.length > 0 ? scorecardValidation : signals.matchLines([/\bnpm run\b/, /\blint\b/, /\bbuild\b/, /\btest\b/, /\bvalidate/, /\bpassed\b/, /\bfailed\b/], ""),
      "No validation evidence captured",
    ),
    changedFileSignals: normalizeSignals(
      scorecardChangedFiles.length > 0 ? scorecardChangedFiles : signals.matchLines([/\bsrc\//, /\bapp\//, /\blib\//, /\bserver\//, /\bcomponents\//, /\bchanged files?\b/], ""),
      "No changed-file signal captured",
    ),
    reviewerSignals: normalizeSignals(
      scorecardReview.length > 0 ? scorecardReview : signals.matchLines([/\bsentry\b/, /\btitan\b/, /\breview\b/, /\bqa\b/, /\bapproval\b/], ""),
      "No reviewer signal captured",
    ),
    artifactSignals: normalizeSignals(
      scorecardArtifacts.length > 0
        ? scorecardArtifacts
        : githubObjects.length > 0
          ? githubObjects.slice(0, 4).map((item) => `${item.type.replaceAll("_", " ")}: ${item.ref}`)
          : signals.matchLines([/\bbranch\b/, /\bcommit\b/, /\bsha\b/, /\bpr\b/, /\bpull request\b/], ""),
      "No branch/commit artifact captured",
    ),
    verificationStatus: computeVerificationStatus(run, lower, closureOutcome),
    verificationOwner: closureOutcome === "done" || closureOutcome === "review" ? "Sentry" : undefined,
    updatedAt: new Date().toISOString(),
    ...closure,
  };
}

export function readRunScorecard(runId: string): PersistedRunScorecard | null {
  const db = getSqliteDb();
  const row = db.prepare("SELECT payload_json FROM run_scorecards WHERE run_id = ?").get(runId) as { payload_json: string } | undefined;
  return row ? fromJson<PersistedRunScorecard | null>(row.payload_json, null) : null;
}

export function writeRunScorecard(run: Run, githubObjects: LinkedGithubObject[] = []) {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  const payload = extractRunScorecard(run, githubObjects);
  db.prepare(
    `
      INSERT INTO run_scorecards (run_id, task_id, flow_id, payload_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(run_id) DO UPDATE SET
        task_id=excluded.task_id,
        flow_id=excluded.flow_id,
        payload_json=excluded.payload_json,
        updated_at=excluded.updated_at
    `,
  ).run(run.id, run.taskId, run.flowId, asJson(payload), now, now);
  return payload;
}
