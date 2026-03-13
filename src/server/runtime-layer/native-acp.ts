import { invokeGatewayTool } from "@/server/runtime-layer/tools-invoke";
import type { NativeAcpRunRequest, NativeAcpRunResult } from "@/server/runtime-layer/types";

const DEFAULT_TIMEOUT_SECONDS = 120;
const POLL_INTERVAL_MS = 1000;
const MAX_HISTORY_POLLS = 120;

type SpawnDetails = {
  status: "accepted" | string;
  childSessionKey: string;
  runId?: string;
  mode?: string;
  note?: string;
};

type HistoryDetails = {
  sessionKey: string;
  messages: Array<{
    role: string;
    content?: string | Array<{ type?: string; text?: string }>;
    timestamp?: number;
  }>;
  truncated?: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractAssistantText(content: HistoryDetails["messages"][number]["content"]) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (part?.type === "text" ? part.text || "" : ""))
      .join("\n")
      .trim();
  }

  return "";
}

async function waitForAssistantReply(sessionKey: string) {
  for (let attempt = 0; attempt < MAX_HISTORY_POLLS; attempt += 1) {
    const history = await invokeGatewayTool<HistoryDetails>("sessions_history", {
      sessionKey,
      limit: 20,
      includeTools: false,
    });

    const assistantMessage = [...history.messages].reverse().find((message) => message.role === "assistant");
    const assistantText = assistantMessage ? extractAssistantText(assistantMessage.content) : "";

    if (assistantText) {
      return {
        sessionKey: history.sessionKey,
        finalOutput: assistantText,
      };
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for ACP response from ${sessionKey}`);
}

export async function runNativeAcp(request: NativeAcpRunRequest): Promise<NativeAcpRunResult> {
  try {
    const spawn = await invokeGatewayTool<SpawnDetails>("sessions_spawn", {
      task: request.prompt,
      runtime: "acp",
      agentId: request.agent,
      mode: "run",
      cleanup: "delete",
      runTimeoutSeconds: request.timeoutSeconds || DEFAULT_TIMEOUT_SECONDS,
    });

    if (!spawn.childSessionKey) {
      return {
        ok: false,
        error: {
          message: "Native ACP spawn did not return a child session key",
          code: "MISSING_CHILD_SESSION_KEY",
          retryable: false,
        },
      };
    }

    const result = await waitForAssistantReply(spawn.childSessionKey);

    return {
      ok: true,
      sessionKey: result.sessionKey,
      finalOutput: result.finalOutput,
      summary: result.finalOutput.slice(0, 240),
      rawOutput: result.finalOutput,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown native ACP failure",
        code: "NATIVE_ACP_RUN_FAILED",
        retryable: false,
      },
    };
  }
}
