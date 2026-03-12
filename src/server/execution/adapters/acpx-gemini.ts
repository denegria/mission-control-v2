import type { ExecutionAdapter, ExecutionAdapterContext } from "@/server/execution/adapters/types";
import { promptWithAcpxSession } from "@/server/execution/acpx";

const GEMINI_SESSION_NAME = "mission-control-phase3-gemini";

export const acpxGeminiAdapter: ExecutionAdapter = {
  async execute(context: ExecutionAdapterContext) {
    return promptWithAcpxSession({
      agent: "gemini",
      sessionName: GEMINI_SESSION_NAME,
      cwd: process.cwd(),
      prompt: context.run.inputPayload.prompt,
    });
  },
};
