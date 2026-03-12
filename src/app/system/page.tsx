import { AppShell } from "@/components/mc/AppShell";
import { Panel } from "@/components/mc/AppShell";
import { getSettings } from "@/server/domain/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function SystemPage() {
  const settings = getSettings();
  return (
    <AppShell activeTab="system">
      <div className="mc-heading-row">
        <div>
          <h2>Settings</h2>
          <p>Real but shallow operational defaults across approvals, lanes, display, GitHub, and retention.</p>
        </div>
      </div>
      <div className="mc-project-grid">
        <Panel>
          <h3>Operators</h3>
          <p className="mc-proj-desc">Default operator: {settings?.operators.defaultOperatorLabel ?? "Giuseppe"}</p>
          <p className="mc-proj-desc">Roster: {(settings?.operators.actorRoster ?? []).map((actor) => actor.label).join(", ")}</p>
        </Panel>
        <Panel>
          <h3>Approval Policy</h3>
          <p className="mc-proj-desc">
            Auto-approve below risk: <strong>{settings?.approvalDefaults.autoApproveBelowRisk ?? "low"}</strong>
          </p>
          <p className="mc-proj-desc">Require approval for: {(settings?.approvalDefaults.requireApprovalFor ?? []).join(", ")}</p>
        </Panel>
        <Panel>
          <h3>Risk Defaults</h3>
          <p className="mc-proj-desc">Destructive threshold: {settings?.riskDefaults.destructiveThreshold ?? "high"}</p>
          <p className="mc-proj-desc">
            External communication threshold: {settings?.riskDefaults.externalCommunicationThreshold ?? "high"}
          </p>
        </Panel>
        <Panel>
          <h3>Lane Defaults</h3>
          <p className="mc-proj-desc">
            Preferred implementation lane: {settings?.laneDefaults.preferredImplementationLane ?? "openclaw_session"}
          </p>
        </Panel>
        <Panel>
          <h3>GitHub Defaults</h3>
          <p className="mc-proj-desc">Linking enabled: {settings?.githubDefaults.enableLinking ? "Yes" : "No"}</p>
          <p className="mc-proj-desc">Default repo: {settings?.githubDefaults.defaultRepo ?? "Not set"}</p>
          <p className="mc-proj-desc">Base branch: {settings?.githubDefaults.defaultBaseBranch ?? "main"}</p>
          <p className="mc-proj-desc">Issue mode: {settings?.githubDefaults.issueCreationMode ?? "manual"}</p>
          <p className="mc-proj-desc">PR mode: {settings?.githubDefaults.pullRequestMode ?? "manual"}</p>
        </Panel>
        <Panel>
          <h3>Display & Retention</h3>
          <p className="mc-proj-desc">Default workboard view: {settings?.display.defaultWorkboardView ?? "kanban"}</p>
          <p className="mc-proj-desc">Show completed by default: {settings?.display.showCompletedByDefault ? "Yes" : "No"}</p>
          <p className="mc-proj-desc">Timeline retention: {settings?.retention.timelineRetentionDays ?? 180} days</p>
        </Panel>
      </div>
    </AppShell>
  );
}
