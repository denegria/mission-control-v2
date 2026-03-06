import { Panel } from "@/components/mc/AppShell";

export function TaskColumns() {
  const columns = [
    {
      name: "Backlog",
      cards: ["Landing metrics cleanup", "Pipeline QA script pass", "Wire team capacity view"],
    },
    {
      name: "In Progress",
      cards: ["Linear-style shell polish", "Topbar command flow", "Giuseppe status feed"],
    },
    {
      name: "Review",
      cards: ["Calendar density tuning", "Memory panel hierarchy"],
    },
  ];

  return (
    <div className="mc-grid-cols-3">
      {columns.map((column) => (
        <Panel key={column.name}>
          <div className="mc-panel-title-row">
            <h3>{column.name}</h3>
            <span>{column.cards.length}</span>
          </div>
          <ul className="mc-card-stack">
            {column.cards.map((card) => (
              <li key={card} className="mc-task-card">
                <p>{card}</p>
                <small>Owner: Giuseppe</small>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}

export function ActivityRail() {
  const items = [
    "Builder pushed shell refactor",
    "Sentry validated route guards",
    "Cisco tuned card contrast",
    "Walter updated copy hierarchy",
    "Titan flagged auth hardening",
  ];

  return (
    <Panel>
      <div className="mc-panel-title-row">
        <h3>Activity</h3>
        <span>Live</span>
      </div>
      <ul className="mc-activity-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Panel>
  );
}

export function ProjectCards() {
  const cards = [
    { name: "Mission Control v2", progress: 38, owner: "Giuseppe" },
    { name: "AI Receptionist Dashboard", progress: 71, owner: "Builder" },
    { name: "Auth QA Sweep", progress: 54, owner: "Sentry" },
  ];

  return (
    <div className="mc-grid-cols-3">
      {cards.map((card) => (
        <Panel key={card.name}>
          <h3>{card.name}</h3>
          <p className="mc-muted">Owner: {card.owner}</p>
          <div className="mc-progress">
            <div style={{ width: `${card.progress}%` }} />
          </div>
          <p className="mc-progress-label">{card.progress}% complete</p>
        </Panel>
      ))}
    </div>
  );
}
