import { getRun, getTaskDetail } from "@/server/domain/repository";
import type { ExecutionAdapter } from "@/server/execution/adapters/types";
import { acpxCodexAdapter } from "@/server/execution/adapters/acpx-codex";
import { acpxGeminiAdapter } from "@/server/execution/adapters/acpx-gemini";
import { nativeAcpCodexAdapter } from "@/server/execution/adapters/native-acp-codex";
import { markRunCompleted, markRunFailed, markRunStarted } from "@/server/domain/commands";

function resolveAdapter(adapter: string): ExecutionAdapter | null {
  switch (adapter) {
    case "acpx_codex":
      return acpxCodexAdapter;
    case "native_acp_codex":
      return nativeAcpCodexAdapter;
    case "acpx_gemini":
      return acpxGeminiAdapter;
    default:
      return null;
  }
}

export async function dispatchRun(runId: string) {
  const run = getRun(runId);
  if (!run) {
    return null;
  }
  if (run.status !== "queued") {
    return run;
  }

  const detail = getTaskDetail(run.taskId);
  const flow = detail?.flows.find((item) => item.id === run.flowId);
  if (!detail || !flow) {
    return markRunFailed({
      runId,
      actor: "dispatcher",
      errorPayload: {
        message: "Task or flow context not found for run dispatch.",
        code: "RUN_CONTEXT_MISSING",
        retryable: false,
      },
    });
  }

  const adapter = resolveAdapter(run.adapter);
  if (!adapter) {
    return markRunFailed({
      runId,
      actor: "dispatcher",
      errorPayload: {
        message: `Unsupported run adapter: ${run.adapter}`,
        code: "RUN_ADAPTER_UNSUPPORTED",
        retryable: false,
      },
    });
  }

  const startedRun = markRunStarted({
    runId,
    actor: "dispatcher",
  });
  if (!startedRun) {
    return null;
  }

  const result = await adapter.execute({
    run: startedRun,
    task: detail.task,
    flow,
  });

  if (result.ok) {
    return markRunCompleted({
      runId,
      actor: "dispatcher",
      workerLink: result.workerLink,
      resultPayload: {
        finalOutput: result.finalOutput,
        summary: result.summary,
        rawOutput: result.rawOutput,
      },
    });
  }

  return markRunFailed({
    runId,
    actor: "dispatcher",
    workerLink: result.workerLink,
    errorPayload: {
      message: result.message,
      code: result.code,
      retryable: result.retryable,
      rawOutput: result.rawOutput,
    },
  });
}
