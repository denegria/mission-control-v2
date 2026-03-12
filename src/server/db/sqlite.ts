import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

type DatabaseSyncLike = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...args: unknown[]) => unknown;
    get: (...args: unknown[]) => unknown;
    all: (...args: unknown[]) => unknown[];
  };
};

let dbInstance: DatabaseSyncLike | null = null;

export function getSqliteDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const configuredPath = process.env.MC_DB_PATH ?? "./data/mission-control.sqlite";
  const absolutePath = resolve(process.cwd(), configuredPath);
  mkdirSync(dirname(absolutePath), { recursive: true });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: new (path: string) => DatabaseSyncLike };
  dbInstance = new DatabaseSync(absolutePath);
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
