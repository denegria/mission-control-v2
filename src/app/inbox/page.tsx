import { AppShell, Panel } from "@/components/mc/AppShell";

const messages = [
  { from: "Alvaro", summary: "Need exact left bar parity", when: "2m" },
  { from: "Builder", summary: "Shell refactor branch ready", when: "7m" },
  { from: "Sentry", summary: "Visual QA notes uploaded", when: "16m" },
];

export default function InboxPage() {
  return (
    <AppShell activeTab="inbox" title="Inbox" subtitle="Recent updates and requests">
      <Panel>
        <ul className="mc-activity-list">
          {messages.map((message) => (
            <li key={`${message.from}-${message.summary}`}>
              <strong>{message.from}</strong> · {message.summary} <span className="mc-muted">({message.when})</span>
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
