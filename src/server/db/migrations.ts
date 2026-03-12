import { getSqliteDb } from "@/server/db/sqlite";

let migrated = false;

function addColumnIfMissing(tableName: string, columnName: string, columnSql: string) {
  const db = getSqliteDb();
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql}`);
  }
}

export function runMigrations() {
  if (migrated) {
    return;
  }

  const db = getSqliteDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS event_log (
      id TEXT PRIMARY KEY,
      aggregate_type TEXT NOT NULL,
      aggregate_id TEXT NOT NULL,
      task_id TEXT,
      flow_id TEXT,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_event_log_task_id ON event_log(task_id);
    CREATE INDEX IF NOT EXISTS idx_event_log_created_at ON event_log(created_at);

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      objective TEXT NOT NULL,
      requester TEXT NOT NULL,
      owner TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      acceptance_criteria_json TEXT,
      dependencies_json TEXT,
      linked_projects_json TEXT,
      linked_artifacts_json TEXT,
      linked_github_objects_json TEXT,
      tags_json TEXT,
      summary TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS flows (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      owner TEXT NOT NULL,
      status TEXT NOT NULL,
      objective TEXT,
      inputs_json TEXT,
      outputs_json TEXT,
      dependencies_json TEXT,
      linked_lane_json TEXT,
      linked_artifacts_json TEXT,
      linked_github_objects_json TEXT,
      summary TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_flows_task_id ON flows(task_id);

    CREATE TABLE IF NOT EXISTS handoffs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      flow_id TEXT,
      source_flow_id TEXT,
      target_flow_id TEXT,
      from_actor TEXT NOT NULL,
      to_actor TEXT NOT NULL,
      intent TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      constraints_json TEXT,
      evidence_json TEXT,
      confidence REAL,
      open_questions_json TEXT,
      status TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_handoffs_task_id ON handoffs(task_id);

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      risk_category TEXT NOT NULL,
      requested_action TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT,
      evidence_json TEXT,
      decision_by TEXT,
      decision_reason TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_approvals_task_id ON approvals(task_id);
    CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      flow_id TEXT,
      actor TEXT NOT NULL,
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_timeline_task_created ON timeline_events(task_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS lane_links (
      id TEXT PRIMARY KEY,
      lane_type TEXT NOT NULL,
      label TEXT NOT NULL,
      external_id TEXT NOT NULL,
      task_id TEXT,
      flow_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS protocol_messages (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      flow_id TEXT,
      message_type TEXT NOT NULL,
      from_actor TEXT NOT NULL,
      to_actor TEXT NOT NULL,
      summary TEXT NOT NULL,
      autonomy_scope TEXT NOT NULL,
      status TEXT NOT NULL,
      references_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_protocol_messages_task_id ON protocol_messages(task_id);
    CREATE INDEX IF NOT EXISTS idx_protocol_messages_flow_id ON protocol_messages(flow_id);
  `);

  addColumnIfMissing("projects", "github_repo", "github_repo TEXT");
  addColumnIfMissing("projects", "github_default_base_branch", "github_default_base_branch TEXT");
  addColumnIfMissing("protocol_messages", "status_note", "status_note TEXT");
  addColumnIfMissing("protocol_messages", "handled_by", "handled_by TEXT");
  addColumnIfMissing("protocol_messages", "handled_at", "handled_at TEXT");
  addColumnIfMissing("protocol_messages", "canonical_transition_json", "canonical_transition_json TEXT");

  migrated = true;
}
