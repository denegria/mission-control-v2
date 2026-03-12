import type { ExecutionAdapter, ExecutionAdapterContext } from "@/server/execution/adapters/types";
import { promptWithAcpxSession } from "@/server/execution/acpx";

const CODEX_SESSION_NAME = "mission-control-phase3";

export const acpxCodexAdapter: ExecutionAdapter = {
  async execute(context: ExecutionAdapterContext) {
    return promptWithAcpxSession({
      agent: "codex",
      sessionName: CODEX_SESSION_NAME,
      cwd: process.cwd(),
      prompt: context.run.inputPayload.prompt,
    });
  },
};
