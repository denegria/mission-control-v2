import { postGatewayJson } from "@/server/runtime-layer/client";
import type { GatewayToolInvokeResponse } from "@/server/runtime-layer/types";

export async function invokeGatewayTool<T>(tool: string, args: Record<string, unknown>) {
  const response = await postGatewayJson<GatewayToolInvokeResponse<T>>("/tools/invoke", {
    tool,
    args,
  });

  if (!response.ok) {
    throw new Error(response.error.message || `Tool invocation failed for ${tool}`);
  }

  return response.result;
}
