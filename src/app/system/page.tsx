import { AppShell } from "@/components/mc/AppShell";
import { Panel } from "@/components/mc/AppShell";
import { getSqliteStorageStatus } from "@/server/db/sqlite";
import { getSettings } from "@/server/domain/repository";
import { getRuntimeLayerStatus } from "@/server/runtime-layer/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function SystemPage() {
  const settings = getSettings();
  const storage = getSqliteStorageStatus();
  const runtimeLayer = getRuntimeLayerStatus();
  const storageTone = storage.durability === "ephemeral" ? "warning" : "success";
  const runtimeTone = runtimeLayer.warning ? "warning" : "success";

  return (
    <AppShell activeTab="system">
      <div className="mc-heading-row">
        <div>
          <h2>Settings</h2>
          <p>Real but shallow operational defaults across approvals, lanes, display, GitHub, and retention.</p>
        </div>
      </div>
      <div className="mc-project-grid">
        <Panel className={storage.durability === "ephemeral" ? "mc-panel-warning" : "mc-panel-emphasis"}>
          <div className="mc-system-card-head">
            <h3>Storage</h3>
            <span className={`mc-system-chip is-${storageTone}`}>
              {storage.durability === "ephemeral" ? "Preview-only" : "Durable"}
            </span>
          </div>
          <p className="mc-proj-desc">{storage.label}</p>
          <p className="mc-system-path">{storage.path}</p>
          {storage.warning ? <p className="mc-system-warning">{storage.warning}</p> : null}
        </Panel>
        <Panel className={runtimeLayer.warning ? "mc-panel-warning" : "mc-panel-emphasis"}>
          <div className="mc-system-card-head">
            <h3>Runtime Gateway</h3>
            <span className={`mc-system-chip is-${runtimeTone}`}>
              {runtimeLayer.gatewayReachability === "local" ? "Local" : "Remote"}
            </span>
          </div>
          <p className="mc-proj-desc">OpenClaw worker dispatch target</p>
          <p className="mc-system-path">{runtimeLayer.gatewayUrl}</p>
          <div className="mc-system-facts">
            <span>Token: {runtimeLayer.tokenConfigured ? "configured" : "not configured"}</span>
            <span>Timeout: {Math.round(runtimeLayer.timeoutMs / 1000)}s</span>
          </div>
          {runtimeLayer.warning ? <p className="mc-system-warning">{runtimeLayer.warning}</p> : null}
        </Panel>
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
