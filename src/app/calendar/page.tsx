import { AppShell, Panel } from "@/components/mc/AppShell";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  return (
    <AppShell activeTab="calendar" title="Calendar" subtitle="Execution routines and key blocks">
      <Panel>
        <div className="mc-panel-title-row">
          <h3>Week View</h3>
          <span>UTC</span>
        </div>
        <div className="mc-calendar-grid">
          {days.map((day, idx) => (
            <div key={day} className="mc-calendar-cell">
              <strong>{day}</strong>
              <div className={`mc-event e-${(idx % 4) + 1}`}>Focus block · Giuseppe</div>
              <div className="mc-event e-5">QA loop · Sentry</div>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
