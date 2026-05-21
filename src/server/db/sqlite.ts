import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import Database from "better-sqlite3";

type DatabaseSyncLike = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...args: unknown[]) => unknown;
    get: (...args: unknown[]) => unknown;
    all: (...args: unknown[]) => unknown[];
  };
};

let dbInstance: DatabaseSyncLike | null = null;

export type SqliteStorageStatus = {
  mode: "configured_sqlite" | "vercel_tmp_sqlite" | "local_sqlite";
  durability: "durable" | "ephemeral";
  label: string;
  path: string;
  warning: string | null;
};

function getDefaultDbPath() {
  if (process.env.VERCEL) {
    return "/tmp/mission-control.sqlite";
  }

  return "./data/mission-control.sqlite";
}

function getConfiguredDbPath() {
  return process.env.MC_DB_PATH ?? getDefaultDbPath();
}

function toAbsolutePath(dbPath: string) {
  return isAbsolute(dbPath) ? dbPath : resolve(process.cwd(), dbPath);
}

export function getSqliteStorageStatus(): SqliteStorageStatus {
  const configuredPath = getConfiguredDbPath();
  const path = toAbsolutePath(configuredPath);

  if (process.env.MC_DB_PATH) {
    return {
      mode: "configured_sqlite",
      durability: "durable",
      label: "Configured SQLite path",
      path,
      warning: null,
    };
  }

  if (process.env.VERCEL) {
    return {
      mode: "vercel_tmp_sqlite",
      durability: "ephemeral",
      label: "Vercel preview SQLite",
      path,
      warning:
        "This preview is using Vercel /tmp storage. It unblocks QA, but data can reset on cold start or redeploy.",
    };
  }

  return {
    mode: "local_sqlite",
    durability: "durable",
    label: "Local SQLite",
    path,
    warning: null,
  };
}

export function getSqliteDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const absolutePath = getSqliteStorageStatus().path;
  mkdirSync(dirname(absolutePath), { recursive: true });

  const rawDb = new Database(absolutePath);
  dbInstance = rawDb as unknown as DatabaseSyncLike;
  dbInstance.exec("PRAGMA journal_mode = WAL;");
  dbInstance.exec("PRAGMA foreign_keys = ON;");
  return dbInstance as DatabaseSyncLike;
}

export function asJson<T>(value: T): string {
  return JSON.stringify(value);
}

export function fromJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
