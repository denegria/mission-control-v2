import type { NativeAcpRunRequest, NativeAcpRunResult } from "@/server/runtime-layer/types";

export async function runNativeAcp(request: NativeAcpRunRequest): Promise<NativeAcpRunResult> {
  void request;

  return {
    ok: false,
    error: {
      message: "native ACP runtime layer is scaffolded but not implemented yet",
      code: "NOT_IMPLEMENTED",
      retryable: false,
    },
  };
}
