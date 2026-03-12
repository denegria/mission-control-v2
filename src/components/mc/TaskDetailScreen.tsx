import {
  AUTONOMY_SCOPES,
  FLOW_STATUSES,
  FLOW_TYPES,
  HANDOFF_STATUSES,
  LANE_TYPES,
  PROTOCOL_MESSAGE_TYPES,
  PROTOCOL_STATUSES,
  RISK_CATEGORIES,
  RUN_ADAPTERS,
  TASK_STATUSES,
  type Approval,
  type Flow,
  type LinkedGithubObject,
  type Handoff,
  type LaneLink,
  type Project,
  type ProtocolMessage,
  type Run,
  type Settings,
  type Task,
  type TimelineEvent,
} from "@/domain/schema";
import { Panel } from "@/components/mc/AppShell";
import type { ActorOption } from "@/lib/actors";
import { getActorLabel } from "@/lib/actors";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCanonicalTransition(transition?: ProtocolMessage["canonicalTransition"]) {
  if (!transition) {
    return null;
  }

  return `${transition.type} • ${transition.transition.replaceAll("_", " ")}`;
}

function fmtRunAdapter(adapter: Run["adapter"]) {
  return adapter.replace("acpx_", "");
}

export function TaskDetailScreen({
  task,
  flows,
  handoffs,
  approvals,
  runs,
  protocolMessages,
  lanes,
  timeline,
  projects,
  actorOptions,
  settings,
  onUpdateTaskStatus,
  onUpdateTaskOwner,
  onUpdateTaskProject,
  onUpdateFlowStatus,
  onUpdateFlowOwner,
  onCreateFlow,
  onSubmitHandoff,
  onUpdateHandoffStatus,
  onRequestApproval,
  onDispatchFlowRun,
  onLinkLane,
  onLinkGithubObject,
  onCreateGithubIssue,
  onEmitProtocolMessage,
  onUpdateProtocolMessageStatus,
  githubIssueFeedback,
  dispatchFeedback,
}: {
  task: Task;
  flows: Flow[];
  handoffs: Handoff[];
  approvals: Approval[];
  runs: Run[];
  protocolMessages: ProtocolMessage[];
  lanes: LaneLink[];
  timeline: TimelineEvent[];
  projects: Project[];
  actorOptions: ActorOption[];
  settings: Settings | null;
  onUpdateTaskStatus: (formData: FormData) => void | Promise<void>;
  onUpdateTaskOwner: (formData: FormData) => void | Promise<void>;
  onUpdateTaskProject: (formData: FormData) => void | Promise<void>;
  onUpdateFlowStatus: (formData: FormData) => void | Promise<void>;
  onUpdateFlowOwner: (formData: FormData) => void | Promise<void>;
  onCreateFlow: (formData: FormData) => void | Promise<void>;
  onSubmitHandoff: (formData: FormData) => void | Promise<void>;
  onUpdateHandoffStatus: (formData: FormData) => void | Promise<void>;
  onRequestApproval: (formData: FormData) => void | Promise<void>;
  onDispatchFlowRun: (formData: FormData) => void | Promise<void>;
  onLinkLane: (formData: FormData) => void | Promise<void>;
  onLinkGithubObject: (formData: FormData) => void | Promise<void>;
  onCreateGithubIssue: (formData: FormData) => void | Promise<void>;
  onEmitProtocolMessage: (formData: FormData) => void | Promise<void>;
  onUpdateProtocolMessageStatus: (formData: FormData) => void | Promise<void>;
  githubIssueFeedback?: { tone: "success" | "error"; message: string };
  dispatchFeedback?: { tone: "success" | "error"; message: string };
}) {
  const currentProjectId = task.linkedProjects?.[0] ?? "";
  const currentProjectName = projects.find((project) => project.id === currentProjectId)?.name ?? "Unlinked";

  function renderGithubLink(link: LinkedGithubObject, key: string) {
    return (
      <article key={key} className="mc-task-card">
        <h4>{link.title ?? link.ref}</h4>
        <p>
          {link.type.replaceAll("_", " ")}
          {link.state ? ` • ${link.state}` : ""}
        </p>
        {link.repo ? <p>{link.repo}</p> : null}
        {link.url ? (
          <p>
            <a href={link.url} target="_blank" rel="noreferrer" className="mc-inline-link">
              {link.url}
            </a>
          </p>
        ) : null}
      </article>
    );
  }

  return (
    <div className="mc-detail-wrap">
      <div className="mc-heading-row">
        <div>
          <h2>{task.title}</h2>
          <p>{task.objective}</p>
        </div>
      </div>

      <div className="mc-detail-grid">
        <Panel>
          <h3 className="mc-col-title">Overview</h3>
          <p className="mc-meta-line">Owner: {getActorLabel(task.owner, settings)}</p>
          <p className="mc-meta-line">Requester: {getActorLabel(task.requester, settings)}</p>
          <p className="mc-meta-line">Status: {task.status.replaceAll("_", " ")}</p>
          <p className="mc-meta-line">Priority: {task.priority}</p>
          <p className="mc-meta-line">Project: {currentProjectName}</p>
          <p className="mc-meta-line">Updated: {fmtDate(task.updatedAt)}</p>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">Task Controls</h3>
          <form action={onUpdateTaskStatus} className="mc-inline-form">
            <select name="status" className="mc-filter-select" defaultValue={task.status}>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <button className="mc-filter-pill" type="submit">
              Update status
            </button>
          </form>
          <form action={onUpdateTaskOwner} className="mc-inline-form">
            <select name="owner" className="mc-filter-select" defaultValue={task.owner}>
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>
            <button className="mc-filter-pill" type="submit">
              Update owner
            </button>
          </form>
          <form action={onUpdateTaskProject} className="mc-inline-form">
            <select name="projectId" className="mc-filter-select" defaultValue={currentProjectId}>
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button className="mc-filter-pill" type="submit">
              Update project
            </button>
          </form>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">GitHub Links</h3>
          <form action={onCreateGithubIssue} className="mc-inline-form mc-stacked-form">
            <select name="scope" className="mc-filter-select" defaultValue="task">
              <option value="task">Task</option>
              <option value="flow">Flow</option>
            </select>
            <select name="flowId" className="mc-filter-select" defaultValue="">
              <option value="">No flow selected</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.title}
                </option>
              ))}
            </select>
            <input name="title" className="mc-inline-input" placeholder="Issue title (optional)" />
            <textarea name="body" className="mc-inline-input" placeholder="Issue body (optional)" rows={5} />
            <button className="mc-filter-pill" type="submit">
              Create GitHub issue
            </button>
          </form>
          {githubIssueFeedback ? (
            <p className="mc-meta-line" data-tone={githubIssueFeedback.tone}>
              {githubIssueFeedback.message}
            </p>
          ) : null}
          <form action={onLinkGithubObject} className="mc-inline-form mc-stacked-form">
            <select name="scope" className="mc-filter-select" defaultValue="task">
              <option value="task">Task</option>
              <option value="flow">Flow</option>
            </select>
            <select name="flowId" className="mc-filter-select" defaultValue="">
              <option value="">No flow selected</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.title}
                </option>
              ))}
            </select>
            <select name="type" className="mc-filter-select" defaultValue="issue">
              <option value="issue">issue</option>
              <option value="pull_request">pull request</option>
              <option value="branch">branch</option>
              <option value="commit">commit</option>
              <option value="check_run">check run</option>
              <option value="review">review</option>
            </select>
            <input name="ref" className="mc-inline-input" placeholder="Ref (#123, branch, sha)" required />
            <input name="title" className="mc-inline-input" placeholder="Title (optional)" />
            <input name="repo" className="mc-inline-input" placeholder="Repo (optional)" />
            <input name="state" className="mc-inline-input" placeholder="State (optional)" />
            <input name="url" className="mc-inline-input" placeholder="GitHub URL (optional)" />
            <button className="mc-filter-pill" type="submit">
              Link GitHub object
            </button>
          </form>
          <div className="mc-task-stack">
            {task.linkedGithubObjects?.length ? task.linkedGithubObjects.map((link) => renderGithubLink(link, `task-${link.type}-${link.ref}`)) : <div className="mc-empty-col">No task GitHub links</div>}
          </div>
          {flows.some((flow) => (flow.linkedGithubObjects?.length ?? 0) > 0) ? (
            <div className="mc-task-stack">
              {flows.map((flow) =>
                flow.linkedGithubObjects?.map((link) =>
                  renderGithubLink(link, `flow-${flow.id}-${link.type}-${link.ref}`),
                ),
              )}
            </div>
          ) : null}
        </Panel>

        <Panel>
          <h3 className="mc-col-title">Acceptance Criteria</h3>
          <ul className="mc-activity-feed">
            {(task.acceptanceCriteria ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">Flows</h3>
          <form action={onCreateFlow} className="mc-inline-form mc-stacked-form">
            <input name="title" className="mc-inline-input" placeholder="Flow title" required />
            <select name="type" className="mc-filter-select" defaultValue="implementation">
              {FLOW_TYPES.map((flowType) => (
                <option key={flowType} value={flowType}>
                  {flowType}
                </option>
              ))}
            </select>
            <select name="owner" className="mc-filter-select" defaultValue="senior-builder">
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>
            <input name="objective" className="mc-inline-input" placeholder="Objective (optional)" />
            <button className="mc-filter-pill" type="submit">
              Create flow
            </button>
          </form>
          {dispatchFeedback ? (
            <p className="mc-meta-line" data-tone={dispatchFeedback.tone}>
              {dispatchFeedback.message}
            </p>
          ) : null}
          <div className="mc-task-stack">
            {flows.map((flow) => {
              const flowProtocolItems = protocolMessages.filter(
                (message) => message.flowId === flow.id && message.status !== "resolved",
              );
              const flowExceptions = flowProtocolItems.filter(
                (message) => message.type === "blocker_raise" || message.type === "escalation_raise",
              );
              const flowRuns = runs.filter((run) => run.flowId === flow.id);
              const latestRun = flowRuns[0];
              const recentRuns = flowRuns.slice(0, 3);
              const activeRun = flowRuns.find((run) => run.status === "queued" || run.status === "running");
              const approvedApprovals = approvals.filter(
                (approval) =>
                  approval.status === "approved" &&
                  ((approval.targetType === "flow" && approval.targetId === flow.id) ||
                    (approval.targetType === "task" && approval.targetId === task.id)),
              );

              return (
                <article key={flow.id} className="mc-task-card">
                  <h4>
                    {flow.title} ({flow.type})
                  </h4>
                  <p>
                    {getActorLabel(flow.owner, settings)} • {flow.status.replaceAll("_", " ")}
                  </p>
                  {flowExceptions.length > 0 ? (
                    <p>
                      {flowExceptions.length} active protocol exception
                      {flowExceptions.length === 1 ? "" : "s"}
                    </p>
                  ) : null}
                  {flowProtocolItems.length > 0 ? (
                    <p>
                      {flowProtocolItems.length} active protocol item
                      {flowProtocolItems.length === 1 ? "" : "s"}
                    </p>
                  ) : null}
                  <form action={onUpdateFlowStatus} className="mc-inline-form">
                    <input type="hidden" name="flowId" value={flow.id} />
                    <select name="status" className="mc-filter-select" defaultValue={flow.status}>
                      {FLOW_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <button className="mc-filter-pill" type="submit">
                      Update status
                    </button>
                  </form>
                  <form action={onUpdateFlowOwner} className="mc-inline-form">
                    <input type="hidden" name="flowId" value={flow.id} />
                    <select name="owner" className="mc-filter-select" defaultValue={flow.owner}>
                      {actorOptions.map((actor) => (
                        <option key={actor.id} value={actor.id}>
                          {actor.label}
                        </option>
                      ))}
                    </select>
                    <button className="mc-filter-pill" type="submit">
                      Update owner
                    </button>
                  </form>
                  <div>
                    <p className="mc-meta-line">Execution lane</p>
                    <p className="mc-meta-line">
                      {approvedApprovals.length > 0
                        ? `${approvedApprovals.length} approved approval${approvedApprovals.length === 1 ? "" : "s"} available for dispatch`
                        : "Dispatch unavailable until an approval is approved"}
                    </p>
                  </div>
                  <form action={onDispatchFlowRun} className="mc-inline-form mc-stacked-form">
                    <input type="hidden" name="flowId" value={flow.id} />
                    <select
                      name="approvalId"
                      className="mc-filter-select"
                      defaultValue={approvedApprovals[0]?.id ?? ""}
                      disabled={approvedApprovals.length === 0}
                    >
                      {approvedApprovals.length === 0 ? <option value="">Select approved approval</option> : null}
                      {approvedApprovals.map((approval) => (
                        <option key={approval.id} value={approval.id}>
                          {approval.targetType === "flow" ? "Flow" : "Task"} approval • {approval.requestedAction}
                        </option>
                      ))}
                    </select>
                    <select name="adapter" className="mc-filter-select" defaultValue="acpx_codex" disabled={Boolean(activeRun)}>
                      {RUN_ADAPTERS.map((adapter) => (
                        <option key={adapter} value={adapter}>
                          {fmtRunAdapter(adapter)}
                        </option>
                      ))}
                    </select>
                    <button className="mc-filter-pill" type="submit" disabled={approvedApprovals.length === 0 || Boolean(activeRun)}>
                      {activeRun ? `Run ${activeRun.status}` : "Dispatch flow run"}
                    </button>
                  </form>
                  {latestRun ? (
                    <div>
                      <p className="mc-meta-line">
                        Latest run • {latestRun.status.replaceAll("_", " ")} via {fmtRunAdapter(latestRun.adapter)}
                        {latestRun.finishedAt ? ` • ${fmtDate(latestRun.finishedAt)}` : latestRun.startedAt ? ` • ${fmtDate(latestRun.startedAt)}` : ""}
                      </p>
                      {latestRun.resultPayload?.summary ? <p>{latestRun.resultPayload.summary}</p> : null}
                      {latestRun.resultPayload?.finalOutput ? <pre className="mc-inline-input">{latestRun.resultPayload.finalOutput}</pre> : null}
                      {latestRun.errorPayload?.message ? <p>{latestRun.errorPayload.message}</p> : null}
                      {recentRuns.length > 1 ? (
                        <div>
                          <p className="mc-meta-line">Recent run history</p>
                          <ul className="mc-activity-feed">
                            {recentRuns.map((run) => (
                              <li key={run.id}>
                                {run.status.replaceAll("_", " ")} via {fmtRunAdapter(run.adapter)}
                                {run.finishedAt ? ` • ${fmtDate(run.finishedAt)}` : run.startedAt ? ` • ${fmtDate(run.startedAt)}` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p>No runs yet.</p>
                  )}
                  {flow.summary ? <p>{flow.summary}</p> : null}
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">Handoffs</h3>
          <form action={onSubmitHandoff} className="mc-inline-form mc-stacked-form">
            <select name="from" className="mc-filter-select" defaultValue="giuseppe">
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>
            <select name="to" className="mc-filter-select" defaultValue="senior-builder">
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>
            <input name="intent" className="mc-inline-input" placeholder="Intent" required />
            <input name="expectedOutput" className="mc-inline-input" placeholder="Expected output" required />
            <select name="flowId" className="mc-filter-select" defaultValue="">
              <option value="">No flow scope</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.title}
                </option>
              ))}
            </select>
            <select name="sourceFlowId" className="mc-filter-select" defaultValue="">
              <option value="">No source flow</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.title}
                </option>
              ))}
            </select>
            <select name="targetFlowId" className="mc-filter-select" defaultValue="">
              <option value="">No target flow</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.title}
                </option>
              ))}
            </select>
            <button className="mc-filter-pill" type="submit">
              Submit handoff
            </button>
          </form>
          <div className="mc-task-stack">
            {handoffs.length === 0 ? (
              <div className="mc-empty-col">No handoffs</div>
            ) : (
              handoffs.map((handoff) => (
                <article key={handoff.id} className="mc-task-card">
                  <h4>
                    {getActorLabel(handoff.from, settings)} → {getActorLabel(handoff.to, settings)}
                  </h4>
                  <p>{handoff.intent}</p>
                  <p>Expected: {handoff.expectedOutput}</p>
                  <p>Status: {(handoff.status ?? "open").replaceAll("_", " ")}</p>
                  <form action={onUpdateHandoffStatus} className="mc-inline-form">
                    <input type="hidden" name="handoffId" value={handoff.id} />
                    <select name="status" className="mc-filter-select" defaultValue={handoff.status ?? "open"}>
                      {HANDOFF_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <button className="mc-filter-pill" type="submit">
                      Update handoff
                    </button>
                  </form>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">Protocol Coordination</h3>
          <form action={onEmitProtocolMessage} className="mc-inline-form mc-stacked-form">
            <select name="type" className="mc-filter-select" defaultValue="blocker_raise">
              {PROTOCOL_MESSAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <select name="from" className="mc-filter-select" defaultValue="giuseppe">
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>
            <select name="to" className="mc-filter-select" defaultValue="giuseppe">
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>
            <input name="summary" className="mc-inline-input" placeholder="Structured summary" required />
            <select name="flowId" className="mc-filter-select" defaultValue="">
              <option value="">Task scoped</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.title}
                </option>
              ))}
            </select>
            <select name="autonomyScope" className="mc-filter-select" defaultValue="within_policy">
              {AUTONOMY_SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {scope.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <button className="mc-filter-pill" type="submit">
              Emit protocol message
            </button>
          </form>
          <div className="mc-task-stack">
            {protocolMessages.length === 0 ? (
              <div className="mc-empty-col">No protocol messages</div>
            ) : (
              protocolMessages.map((message) => (
                <article key={message.id} className="mc-task-card">
                  <h4>{message.type.replaceAll("_", " ")}</h4>
                  <p>
                    {getActorLabel(message.from, settings)} • {getActorLabel(message.to, settings)}
                  </p>
                  <p>{message.summary}</p>
                  <p>
                    {message.autonomyScope.replaceAll("_", " ")} • {message.status}
                  </p>
                  {message.statusNote ? <p>Note: {message.statusNote}</p> : null}
                  {message.handledBy || message.handledAt ? (
                    <p>
                      {message.handledBy ? `Handled by ${getActorLabel(message.handledBy, settings)}` : "Handled"}
                      {message.handledAt ? ` • ${fmtDate(message.handledAt)}` : ""}
                    </p>
                  ) : null}
                  {fmtCanonicalTransition(message.canonicalTransition) ? (
                    <p>Triggered by {fmtCanonicalTransition(message.canonicalTransition)}</p>
                  ) : null}
                  <form action={onUpdateProtocolMessageStatus} className="mc-inline-form mc-stacked-form">
                    <input type="hidden" name="protocolMessageId" value={message.id} />
                    <select name="status" className="mc-filter-select" defaultValue={message.status}>
                      {PROTOCOL_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <input
                      name="statusNote"
                      className="mc-inline-input"
                      defaultValue={message.statusNote ?? ""}
                      placeholder="Status note for blockers or escalations"
                    />
                    <button className="mc-filter-pill" type="submit">
                      Update lifecycle
                    </button>
                  </form>
                  <p>{fmtDate(message.createdAt)}</p>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">Lane Links</h3>
          <form action={onLinkLane} className="mc-inline-form mc-stacked-form">
            <select name="laneType" className="mc-filter-select" defaultValue="openclaw_session">
              {LANE_TYPES.map((laneType) => (
                <option key={laneType} value={laneType}>
                  {laneType}
                </option>
              ))}
            </select>
            <input name="label" className="mc-inline-input" placeholder="Lane label" required />
            <input name="externalId" className="mc-inline-input" placeholder="External identifier" required />
            <button className="mc-filter-pill" type="submit">
              Link lane
            </button>
          </form>
          <div className="mc-task-stack">
            {lanes.length === 0 ? (
              <div className="mc-empty-col">No lanes linked</div>
            ) : (
              lanes.map((lane) => (
                <article key={lane.id} className="mc-task-card">
                  <h4>{lane.label}</h4>
                  <p>{lane.type.replaceAll("_", " ")}</p>
                  <p>{lane.externalId}</p>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">Approvals</h3>
          <form action={onRequestApproval} className="mc-inline-form mc-stacked-form">
            <input name="requestedAction" className="mc-inline-input" placeholder="Requested action" required />
            <select name="flowId" className="mc-filter-select" defaultValue="">
              <option value="">Task scoped</option>
              {flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.title}
                </option>
              ))}
            </select>
            <select name="riskCategory" className="mc-filter-select" defaultValue="high">
              {RISK_CATEGORIES.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
            <input name="summary" className="mc-inline-input" placeholder="Summary (optional)" />
            <button className="mc-filter-pill" type="submit">
              Request approval
            </button>
          </form>
          <div className="mc-task-stack">
            {approvals.length === 0 ? (
              <div className="mc-empty-col">No approvals</div>
            ) : (
              approvals.map((approval) => (
                <article key={approval.id} className="mc-task-card">
                  <h4>{approval.requestedAction}</h4>
                  <p>
                    {approval.riskCategory} risk • {approval.status}
                  </p>
                  <p>Requested by {getActorLabel(approval.requestedBy, settings)}</p>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">Timeline</h3>
          <ul className="mc-activity-feed">
            {timeline.map((event) => (
              <li key={event.id}>
                <strong>{event.summary}</strong>
                <br />
                {getActorLabel(event.actor, settings)} • {fmtDate(event.createdAt)}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
