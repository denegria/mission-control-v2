import { Panel } from "@/components/mc/AppShell";

const taskCards = {
  backlog: [
    "Record Claude Code teardown",
    "Flesh out $10K Mac upgrade plan",
    "Pre-train local model prompt set",
    "Build activity feed for Council",
    "[Reborn] Server player table",
  ],
  progress: ["Build Council social panel", "Research Exo Labs cluster", "Build AI Employee schema"],
  review: ["Load test lane scheduler", "Mission log indexing", "Bug bash for mobile cards"],
  done: ["Agent roster naming parity", "Dark shell baseline"],
};

export function TasksScreen() {
  const stats = [
    { value: "19", label: "This week", tone: "green" },
    { value: "3", label: "In progress", tone: "blue" },
    { value: "42", label: "Total", tone: "white" },
    { value: "45%", label: "Completion", tone: "purple" },
  ];

  const activity = [
    "Scout · 4 trends: Claude presentation",
    "Quill · Claude Code Agent Test",
    "Giuseppe · Completed system status",
    "Scout · Morning research posted",
    "Giuseppe · Evening wrap-up posted",
    "Scout · Readout session replays",
  ];

  return (
    <>
      <div className="mc-stats-row">
        {stats.map((stat) => (
          <div key={stat.label} className="mc-stat">
            <strong className={`tone-${stat.tone}`}>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="mc-toolbar-row">
        <button className="mc-primary">+ New task</button>
        <button className="mc-filter-pill">Alex</button>
        <button className="mc-filter-pill">Giuseppe</button>
        <button className="mc-filter-select">All projects ▾</button>
      </div>

      <div className="mc-board-grid">
        <Panel>
          <h3 className="mc-col-title">• Recurring</h3>
          <div className="mc-empty-col">No tasks</div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">• Backlog</h3>
          <div className="mc-task-stack">
            {taskCards.backlog.map((card) => (
              <article key={card} className="mc-task-card">
                <h4>{card}</h4>
                <p>Owner: Giuseppe</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">• In Progress</h3>
          <div className="mc-task-stack">
            {taskCards.progress.map((card) => (
              <article key={card} className="mc-task-card">
                <h4>{card}</h4>
                <p>Owner: Builder</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">• Review</h3>
          <div className="mc-task-stack">
            {taskCards.review.map((card) => (
              <article key={card} className="mc-task-card">
                <h4>{card}</h4>
                <p>Owner: Sentry</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">• Done</h3>
          <div className="mc-task-stack">
            {taskCards.done.map((card) => (
              <article key={card} className="mc-task-card">
                <h4>{card}</h4>
                <p>Owner: Giuseppe</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="mc-col-title">Live Activity</h3>
          <ul className="mc-activity-feed">
            {activity.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

export function CalendarScreen() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const blocks = [
    ["Trend Radar", "Morning kickoff", "YouTube OpenClaw", "Scout morning research", "Morning brief", "Daily digest", "Evening wrap up"],
    ["Trend Radar", "Morning kickoff", "Stock scarcity research", "Scout morning research", "Morning brief", "Quill script writer", "Evening wrap up"],
    ["Trend Radar", "Morning kickoff", "YouTube OpenClaw", "Scout morning research", "Morning brief", "Quill script writer", "Daily digest"],
    ["Trend Radar", "Morning kickoff", "YouTube OpenClaw", "Scout morning research", "Morning brief", "Trend Radar daily digest", "Weekly newsletter"],
    ["Trend Radar", "Morning kickoff", "YouTube OpenClaw", "Scout morning research", "Morning brief", "Quill script writer", "Daily digest"],
    ["Trend Radar", "Morning kickoff", "YouTube OpenClaw", "Scout morning research", "Morning brief", "Quill script writer", "Daily digest"],
    ["Trend Radar", "Morning kickoff", "YouTube OpenClaw", "Scout morning research", "Morning brief", "Quill script writer", "Daily digest"],
  ];

  return (
    <>
      <div className="mc-heading-row">
        <div>
          <h2>Scheduled Tasks</h2>
          <p>Giuseppe&apos;s automated routines</p>
        </div>
        <div className="mc-week-toggle">
          <button className="is-active">Week</button>
          <button>Today</button>
        </div>
      </div>

      <Panel className="mc-running-strip">
        <strong>⚡ Always Running</strong>
        <div className="mc-chip-row">
          <span>Reaction Poller • every 5 min</span>
          <span>Trend Radar • 5x daily</span>
          <span>Opportunity Scanner • 6x daily</span>
        </div>
      </Panel>

      <div className="mc-week-grid">
        {days.map((day, index) => (
          <Panel key={day} className="mc-day-col">
            <h3>{day}</h3>
            {blocks[index].map((block, blockIndex) => (
              <div key={block} className={`mc-time-block tone-${(blockIndex % 5) + 1}`}>
                <strong>{block}</strong>
                <span>{7 + blockIndex}:00</span>
              </div>
            ))}
          </Panel>
        ))}
      </div>
    </>
  );
}

export function ProjectsScreen() {
  const projects = [
    {
      name: "Agent Org Infrastructure",
      status: "Active",
      desc: "Core infrastructure for the autonomous agent organization.",
      progress: 90,
      owner: "Charlie",
      risk: "high",
    },
    {
      name: "Mission Control",
      status: "Active",
      desc: "Central dashboard for tasks, approvals, activity, docs, and realtime.",
      progress: 70,
      owner: "Giuseppe",
      risk: "high",
    },
    {
      name: "Skool AI Extension",
      status: "Draft",
      desc: "Chrome extension for course context and RAG augmentation.",
      progress: 0,
      owner: "Giuseppe",
      risk: "high",
    },
    {
      name: "Micro-SaaS Factory",
      status: "Planning",
      desc: "Opportunity engine to validate and ship small SaaS products.",
      progress: 0,
      owner: "Violet",
      risk: "medium",
    },
    {
      name: "Even G2 Integration",
      status: "Planning",
      desc: "Bridge app connecting Even glasses to Giuseppe assistant lane.",
      progress: 0,
      owner: "Unassigned",
      risk: "medium",
    },
  ];

  return (
    <>
      <div className="mc-heading-row">
        <div>
          <h2>Projects</h2>
          <p>5 total • 2 active • 3 planning</p>
        </div>
      </div>

      <div className="mc-project-grid">
        {projects.map((project) => (
          <Panel key={project.name}>
            <div className="mc-project-head">
              <h3>{project.name}</h3>
              <span className={`mc-status ${project.status.toLowerCase()}`}>{project.status}</span>
            </div>
            <p className="mc-proj-desc">{project.desc}</p>
            <div className="mc-progress-track">
              <div style={{ width: `${project.progress}%` }} />
            </div>
            <div className="mc-project-meta">
              <span>{project.owner}</span>
              <span className={`risk-${project.risk}`}>{project.risk}</span>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

export function MemoryScreen() {
  const entries = [
    "Thu, Feb 26",
    "Wed, Feb 25",
    "Tue, Feb 24",
    "Mon, Mar 2",
    "Sun, Mar 1",
    "Sat, Feb 28",
  ];

  return (
    <div className="mc-doc-layout">
      <Panel className="mc-doc-list">
        <input className="mc-search-input" placeholder="Search memory..." />
        <div className="mc-long-term">Long-Term Memory ⚙</div>
        <h4>DAILY JOURNAL</h4>
        <ul>
          {entries.map((entry, idx) => (
            <li key={entry} className={idx === 0 ? "is-active" : ""}>
              {entry}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mc-doc-view">
        <div className="mc-doc-head">2026-02-26 — Thursday</div>
        <article>
          <h2>9:00 AM — Qwen 3.5 Medium Series Research</h2>
          <p>
            Key findings: 35B-A3B beats old 235B flagship on efficiency, 122B-A10B matches benchmark quality,
            and dense 27B sets best SWE benchmark of the medium trio.
          </p>
          <ul>
            <li>Keep 37B on Studio 2 for Charlie.</li>
            <li>Add 35B-A3B on Studio 1 as fast parallel worker.</li>
            <li>122B-A10B as possible Charlie upgrade.</li>
            <li>35B-A3B could replace Violet&apos;s MiniMax M2.5 on Mac Mini.</li>
          </ul>
        </article>
      </Panel>
    </div>
  );
}

export function DocsScreen() {
  const files = [
    "2026-02-26.md",
    "2026-02-26-vibe-coding-mainstream.md",
    "arena-prd.md",
    "onboarding-copy.md",
  ];

  return (
    <div className="mc-doc-layout">
      <Panel className="mc-doc-list">
        <input className="mc-search-input" placeholder="Search documents..." />
        <div className="mc-tag-cloud">
          {[
            "Journal",
            "Nova",
            "Other",
            "Docs",
            "Notes",
            "Scripts",
            "Mission",
            "Agents",
            "Product",
          ].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <ul>
          {files.map((file, idx) => (
            <li key={file} className={idx === 1 ? "is-active" : ""}>
              {file}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mc-doc-view">
        <div className="mc-doc-head">2026-02-25-vibe-coding-mainstream.md</div>
        <article>
          <h2>Newsletter Draft — Feb 25, 2026</h2>
          <p>
            This week, the New York Times published an opinion piece about vibe coding. Most people just noticed;
            we&apos;ve been working this lane for months.
          </p>
          <p>
            The key is converting that attention into execution while everyone else is still talking about it.
            That&apos;s our timing edge.
          </p>
        </article>
      </Panel>
    </div>
  );
}

export function PlaceholderTabScreen({ title }: { title: string }) {
  return (
    <Panel className="mc-placeholder">
      <h2>{title}</h2>
      <p>
        This tab is wired into the left bar parity set. Next pass will fill it with full screenshot-level detail.
      </p>
    </Panel>
  );
}
