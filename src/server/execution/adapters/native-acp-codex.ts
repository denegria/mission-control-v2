import type { ExecutionAdapter, ExecutionAdapterContext } from "@/server/execution/adapters/types";
import { runNativeAcp } from "@/server/runtime-layer/native-acp";

export const nativeAcpCodexAdapter: ExecutionAdapter = {
  async execute(context: ExecutionAdapterContext) {
    const result = await runNativeAcp({
      runId: context.run.id,
      flowId: context.run.flowId,
      taskId: context.run.taskId,
      agent: "codex",
      prompt: context.run.inputPayload.prompt,
    });

    if (result.ok) {
      return {
        ok: true,
        finalOutput: result.finalOutput,
        summary: result.summary,
        rawOutput: result.rawOutput,
        workerLink: {
          sessionKey: result.sessionKey,
          sessionId: result.sessionId,
          resumeSessionId: result.sessionId,
        },
      };
    }

    return {
      ok: false,
      message: result.error.message,
      code: result.error.code,
      retryable: result.error.retryable,
      rawOutput: result.error.rawOutput,
      workerLink: {
        sessionKey: result.sessionKey,
        sessionId: result.sessionId,
        resumeSessionId: result.sessionId,
      },
    };
  },
};
