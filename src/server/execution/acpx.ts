import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ExecutionAdapterFailure, ExecutionAdapterResult, ExecutionAdapterSuccess } from "@/server/execution/adapters/types";

const execFileAsync = promisify(execFile);

const ACPX_BINARY = "/usr/lib/node_modules/openclaw/extensions/acpx/node_modules/.bin/acpx";
const ACPX_TIMEOUT_SECONDS = 1200;
const ACPX_MAX_BUFFER = 10 * 1024 * 1024;

export type AcpxAgentName = "codex" | "gemini";

function combineOutput(stdout?: string, stderr?: string) {
  return [stdout?.trim(), stderr?.trim()].filter(Boolean).join("\n\n") || undefined;
}

function summarizeOutput(output: string) {
  const normalized = output.trim();
  if (!normalized) {
    return undefined;
  }
  const firstParagraph = normalized.split("\n\n")[0]?.trim();
  return firstParagraph?.slice(0, 240);
}

function normalizeExecFailure(error: unknown): ExecutionAdapterFailure {
  const record = error as {
    message?: string;
    code?: number | string;
    stdout?: string;
    stderr?: string;
    killed?: boolean;
    signal?: string;
  };

  return {
    ok: false,
    message: record.message?.trim() || "acpx execution failed",
    code: record.code !== undefined ? String(record.code) : record.signal,
    retryable: Boolean(record.killed),
    rawOutput: combineOutput(record.stdout, record.stderr),
  };
}

async function runAcpx(args: string[], cwd: string) {
  return execFileAsync(ACPX_BINARY, args, {
    cwd,
    maxBuffer: ACPX_MAX_BUFFER,
  });
}

export async function ensureAcpxSession(input: {
  agent: AcpxAgentName;
  sessionName: string;
  cwd: string;
}) {
  const { stdout } = await runAcpx(
    ["--cwd", input.cwd, "--format", "json", "--json-strict", input.agent, "sessions", "ensure", "--name", input.sessionName],
    input.cwd,
  );

  const parsed = JSON.parse(stdout) as { acpxRecordId?: string; name?: string };
  return {
    acpxRecordId: parsed.acpxRecordId ?? null,
    name: parsed.name ?? input.sessionName,
  };
}

export async function promptWithAcpxSession(input: {
  agent: AcpxAgentName;
  sessionName: string;
  cwd: string;
  prompt: string;
}): Promise<ExecutionAdapterResult> {
  try {
    await ensureAcpxSession({
      agent: input.agent,
      sessionName: input.sessionName,
      cwd: input.cwd,
    });

    const { stdout, stderr } = await runAcpx(
      [
        "--cwd",
        input.cwd,
        "--approve-all",
        "--non-interactive-permissions",
        "deny",
        "--auth-policy",
        "fail",
        "--timeout",
        String(ACPX_TIMEOUT_SECONDS),
        "--ttl",
        "0",
        "--format",
        "quiet",
        input.agent,
        "--session",
        input.sessionName,
        "prompt",
        input.prompt,
      ],
      input.cwd,
    );

    const finalOutput = stdout.trim();
    const rawOutput = combineOutput(stdout, stderr);
    const success: ExecutionAdapterSuccess = {
      ok: true,
      finalOutput,
      summary: summarizeOutput(finalOutput),
      rawOutput,
    };
    return success;
  } catch (error) {
    return normalizeExecFailure(error);
  }
}
