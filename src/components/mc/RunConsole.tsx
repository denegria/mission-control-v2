import Link from "next/link";
import { Panel } from "@/components/mc/AppShell";
import type { RunConsoleItem, RunLifecycleStage } from "@/domain/runs";
import type { Settings } from "@/domain/schema";
import { getActorLabel } from "@/lib/actors";
import { fmtProductDateTime } from "@/lib/time";

function prettyLabel(value: string) {
  return value.replaceAll("_", " ");
}

function stageLabel(stage: RunLifecycleStage) {
  switch (stage) {
    case "candidate":
      return "Candidate";
    case "finalist":
      return "Finalist";
    case "validated":
      return "Validated";
    case "landed":
      return "Landed";
    case "blocked":
      return "Blocked";
  }
}

function statusTone(status: string) {
  if (status === "completed") {
    return "success";
  }
  if (status === "failed" || status === "canceled") {
    return "danger";
  }
  if (status === "running" || status === "queued") {
    return "active";
  }
  return "neutral";
}

function countBy(items: RunConsoleItem[], predicate: (item: RunConsoleItem) => boolean) {
  return items.filter(predicate).length;
}

function SignalList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mc-run-console-signal-title">{title}</p>
      <ul className="mc-run-console-signals">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function RunConsole({ items, settings }: { items: RunConsoleItem[]; settings: Settings | null }) {
  const activeCount = countBy(items, (item) => item.run.status === "queued" || item.run.status === "running");
  const validatedCount = countBy(items, (item) => item.scorecard.lifecycleStage === "validated" || item.scorecard.lifecycleStage === "landed");
  const blockedCount = countBy(items, (item) => item.scorecard.lifecycleStage === "blocked");
  const reviewNeededCount = countBy(items, (item) => item.scorecard.reviewerSignals.some((signal) => !signal.startsWith("No reviewer")));

  return (
    <>
      <div className="mc-heading-row">
        <div>
          <h2>Run Console</h2>
          <p>Existing Mission Control runs, lanes, worker sessions, and evidence in one operator-grade surface.</p>
        </div>
      </div>

      <div className="mc-stats-row mc-run-console-stats">
        <div className="mc-stat">
          <strong className="tone-white">{items.length}</strong>
          <span>Recent runs</span>
        </div>
        <div className="mc-stat">
          <strong className="tone-blue">{activeCount}</strong>
          <span>Queued/running</span>
        </div>
        <div className="mc-stat">
          <strong className="tone-green">{validatedCount}</strong>
          <span>Validated/landed</span>
        </div>
        <div className="mc-stat">
          <strong className="tone-purple">{reviewNeededCount}</strong>
          <span>Review signals</span>
        </div>
        <div className="mc-stat">
          <strong className="tone-rose">{blockedCount}</strong>
          <span>Blocked</span>
        </div>
      </div>

      <div className="mc-run-console-grid">
        <Panel className="mc-run-console-index">
          <h3 className="mc-col-title">Lane Queue</h3>
          {items.length === 0 ? (
            <div className="mc-empty-col">No runs yet</div>
          ) : (
            <div className="mc-task-stack">
              {items.map((item) => (
                <Link key={item.run.id} href={`/tasks/${item.task.id}`} className="mc-run-console-row">
                  <span className={`mc-run-dot is-${statusTone(item.run.status)}`} />
                  <span>
                    <strong>{item.flow.title}</strong>
                    <small>
                      {stageLabel(item.scorecard.lifecycleStage)} • {prettyLabel(item.run.status)} • {item.scorecard.durationLabel}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <div className="mc-run-console-main">
          {items.map((item) => (
            <article key={item.run.id} className="mc-run-console-card">
              <div className="mc-run-console-card-head">
                <div>
                  <p className="mc-task-kicker">{stageLabel(item.scorecard.lifecycleStage)} run</p>
                  <h3>{item.flow.title}</h3>
                  <p>
                    <Link href={`/tasks/${item.task.id}`} className="mc-inline-link">
                      {item.task.title}
                    </Link>
                    {" • "}
                    {item.flow.type} flow
                  </p>
                </div>
                <div className="mc-flow-badges">
                  <span className={`mc-detail-chip mc-run-status-chip is-${statusTone(item.run.status)}`}>{prettyLabel(item.run.status)}</span>
                  <span className="mc-detail-chip">{item.run.adapter.replaceAll("_", " ")}</span>
                </div>
              </div>

              <div className="mc-run-console-meta-grid">
                <div>
                  <span>Owner</span>
                  <strong>{getActorLabel(item.flow.owner, settings)}</strong>
                </div>
                <div>
                  <span>Agent</span>
                  <strong>{item.run.agent}</strong>
                </div>
                <div>
                  <span>Lane</span>
                  <strong>{item.lane?.label ?? "Unlinked"}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{fmtProductDateTime(item.run.updatedAt)}</strong>
                </div>
                <div>
                  <span>Worker session</span>
                  <strong>{item.run.workerLink?.sessionKey ?? item.run.workerLink?.sessionId ?? "Not attached"}</strong>
                </div>
              </div>

              {item.scorecard.closureSummary || item.scorecard.closureOutcome ? (
                <div className="mc-run-console-closure">
                  <strong>{item.scorecard.closureOutcome ?? "closure"}</strong>
                  <span>{item.scorecard.closureSummary ?? "No closure summary captured"}</span>
                </div>
              ) : null}

              <div className="mc-run-console-scorecard">
                <SignalList title="Validation" items={item.scorecard.validationSignals} />
                <SignalList title="Changed Files" items={item.scorecard.changedFileSignals} />
                <SignalList title="Review" items={item.scorecard.reviewerSignals} />
                <SignalList title="Artifacts" items={item.scorecard.artifactSignals} />
              </div>

              {item.run.errorPayload?.message ? <p className="mc-run-error">{item.run.errorPayload.message}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
