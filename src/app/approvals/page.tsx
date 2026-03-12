import { AppShell } from "@/components/mc/AppShell";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Panel } from "@/components/mc/AppShell";
import { decideApproval, updateProtocolMessageStatus } from "@/server/domain/commands";
import { getSettings, listActiveProtocolExceptions, listPendingApprovals } from "@/server/domain/repository";
import { getActorLabel, getDefaultOperatorId } from "@/lib/actors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCanonicalTransition(transition: { type: string; transition: string } | undefined) {
  if (!transition) {
    return null;
  }

  return `${transition.type} • ${transition.transition.replaceAll("_", " ")}`;
}

export default function ApprovalsPage() {
  const settings = getSettings();
  const actorId = getDefaultOperatorId(settings);
  async function handleApprovalDecision(formData: FormData) {
    "use server";

    const approvalId = String(formData.get("approvalId") ?? "");
    const taskId = String(formData.get("taskId") ?? "");
    const decision = String(formData.get("decision") ?? "");

    if (!approvalId || !taskId || (decision !== "approved" && decision !== "rejected")) {
      return;
    }

    decideApproval({
      approvalId,
      decision,
      decisionBy: actorId,
      decisionReason: `Decision submitted from Approval Queue on ${new Date().toISOString()}`,
    });

    revalidatePath("/approvals");
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${taskId}`);
  }

  async function handleProtocolExceptionAction(formData: FormData) {
    "use server";

    const protocolMessageId = String(formData.get("protocolMessageId") ?? "").trim();
    const taskId = String(formData.get("taskId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    if (!protocolMessageId || !taskId || (status !== "acknowledged" && status !== "resolved")) {
      return;
    }

    updateProtocolMessageStatus({
      protocolMessageId,
      status,
      actor: actorId,
      statusNote: `${status === "acknowledged" ? "Acknowledged" : "Resolved"} from Protocol Exceptions on ${new Date().toISOString()}`,
    });

    revalidatePath("/approvals");
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${taskId}`);
  }

  const approvals = listPendingApprovals();
  const protocolExceptions = listActiveProtocolExceptions();
  const escalatedCount = protocolExceptions.filter((entry) => entry.protocolMessage.status === "escalated").length;
  const blockedCount = protocolExceptions.filter((entry) => entry.protocolMessage.status === "blocked").length;

  return (
    <AppShell activeTab="approvals">
      <div className="mc-heading-row">
        <div>
          <h2>Approval Queue</h2>
          <p>{approvals.length} pending approvals</p>
        </div>
      </div>
      <div className="mc-project-grid">
        {approvals.map((entry) => (
          <Panel key={entry.approval.id}>
            <h3>{entry.approval.requestedAction}</h3>
            <p className="mc-proj-desc">{entry.approval.summary ?? "No summary"}</p>
            <div className="mc-project-meta">
              <span>{entry.approval.riskCategory} risk</span>
              <span>{getActorLabel(entry.approval.requestedBy, settings)}</span>
            </div>
            <div className="mc-toolbar-row">
              <form action={handleApprovalDecision}>
                <input type="hidden" name="approvalId" value={entry.approval.id} />
                <input type="hidden" name="taskId" value={entry.taskId} />
                <input type="hidden" name="decision" value="approved" />
                <button className="mc-filter-pill" type="submit">
                  Approve
                </button>
              </form>
              <form action={handleApprovalDecision}>
                <input type="hidden" name="approvalId" value={entry.approval.id} />
                <input type="hidden" name="taskId" value={entry.taskId} />
                <input type="hidden" name="decision" value="rejected" />
                <button className="mc-filter-pill" type="submit">
                  Reject
                </button>
              </form>
            </div>
            <div className="mc-project-meta">
              <Link href={`/tasks/${entry.taskId}`}>{entry.taskTitle}</Link>
            </div>
          </Panel>
        ))}
      </div>

      <div className="mc-heading-row">
        <div>
          <h2>Protocol Exceptions</h2>
          <p>
            {protocolExceptions.length} active items • {escalatedCount} escalated • {blockedCount} blocked
          </p>
        </div>
      </div>
      <div className="mc-project-grid">
        {protocolExceptions.length === 0 ? (
          <Panel>
            <h3>No active protocol exceptions</h3>
            <p className="mc-proj-desc">Blocked and escalated protocol items will appear here once they are active.</p>
          </Panel>
        ) : (
          protocolExceptions.map((entry) => (
            <Panel key={entry.protocolMessage.id}>
              <h3>{entry.protocolMessage.summary}</h3>
              <p className="mc-proj-desc">
                {entry.protocolMessage.type.replaceAll("_", " ")} • {entry.protocolMessage.status}
              </p>
              <div className="mc-project-meta">
                <span>
                  {getActorLabel(entry.protocolMessage.from, settings)} → {getActorLabel(entry.protocolMessage.to, settings)}
                </span>
                <span>{entry.protocolMessage.autonomyScope.replaceAll("_", " ")}</span>
              </div>
              <div className="mc-project-meta">
                <span>{entry.flowTitle ?? "Task scoped"}</span>
                <span>Updated {fmtDate(entry.protocolMessage.updatedAt)}</span>
              </div>
              {entry.protocolMessage.statusNote ? <p className="mc-proj-desc">{entry.protocolMessage.statusNote}</p> : null}
              {fmtCanonicalTransition(entry.protocolMessage.canonicalTransition) ? (
                <p className="mc-proj-desc">Triggered by {fmtCanonicalTransition(entry.protocolMessage.canonicalTransition)}</p>
              ) : null}
              <div className="mc-toolbar-row">
                <form action={handleProtocolExceptionAction}>
                  <input type="hidden" name="protocolMessageId" value={entry.protocolMessage.id} />
                  <input type="hidden" name="taskId" value={entry.taskId} />
                  <input type="hidden" name="status" value="acknowledged" />
                  <button className="mc-filter-pill" type="submit">
                    Acknowledge
                  </button>
                </form>
                <form action={handleProtocolExceptionAction}>
                  <input type="hidden" name="protocolMessageId" value={entry.protocolMessage.id} />
                  <input type="hidden" name="taskId" value={entry.taskId} />
                  <input type="hidden" name="status" value="resolved" />
                  <button className="mc-filter-pill" type="submit">
                    Resolve
                  </button>
                </form>
              </div>
              <div className="mc-project-meta">
                <Link href={`/tasks/${entry.taskId}`}>{entry.taskTitle}</Link>
              </div>
            </Panel>
          ))
        )}
      </div>
    </AppShell>
  );
}
