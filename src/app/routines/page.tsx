import { AppShell, Panel } from "@/components/mc/AppShell";

const routines = [
  { name: "Morning systems scan", owner: "Titan", cadence: "Daily 08:30" },
  { name: "Pipeline quality check", owner: "Sentry", cadence: "Daily 14:00" },
  { name: "Lead follow-up burst", owner: "Scout", cadence: "Daily 17:00" },
];

export default function RoutinesPage() {
  return (
    <AppShell activeTab="routines" title="Routines" subtitle="Recurring execution loops">
      <div className="mc-grid-cols-3">
        {routines.map((routine) => (
          <Panel key={routine.name}>
            <h3>{routine.name}</h3>
            <p className="mc-muted">Owner: {routine.owner}</p>
            <span className="mc-chip">{routine.cadence}</span>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
