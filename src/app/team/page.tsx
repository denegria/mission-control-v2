import { AppShell, Panel } from "@/components/mc/AppShell";

const team = [
  { name: "Giuseppe", role: "Director", status: "Coordinating" },
  { name: "Builder", role: "Engineering", status: "Shipping" },
  { name: "Sentry", role: "QA", status: "Testing" },
  { name: "Cisco", role: "UX", status: "Designing" },
  { name: "Walter", role: "Copy", status: "Writing" },
  { name: "Titan", role: "Security", status: "Auditing" },
  { name: "Scout", role: "Lead Gen", status: "Researching" },
];

export default function TeamPage() {
  return (
    <AppShell activeTab="team" title="Team" subtitle="Role map and active status">
      <div className="mc-grid-cols-3">
        {team.map((member) => (
          <Panel key={member.name}>
            <h3>{member.name}</h3>
            <p className="mc-muted">{member.role}</p>
            <span className="mc-chip">{member.status}</span>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
