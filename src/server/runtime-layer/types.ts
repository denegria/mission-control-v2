export type RuntimeWorkerAgent = "codex";

export type NativeAcpRunRequest = {
  runId: string;
  flowId: string;
  taskId: string;
  agent: RuntimeWorkerAgent;
  prompt: string;
  timeoutSeconds?: number;
  resumeSessionId?: string;
};

export type NativeAcpRunResult =
  | {
      ok: true;
      sessionKey?: string;
      sessionId?: string;
      finalOutput: string;
      summary?: string;
      rawOutput?: string;
    }
  | {
      ok: false;
      sessionKey?: string;
      sessionId?: string;
      error: {
        message: string;
        code?: string;
        retryable?: boolean;
        rawOutput?: string;
      };
    };

export type RuntimeLayerConfig = {
  gatewayUrl: string;
  gatewayToken?: string;
  timeoutMs: number;
};

export type GatewayToolInvokeSuccess<T> = {
  ok: true;
  result: T;
};

export type GatewayToolInvokeEnvelope<T> = {
  content?: Array<{ type?: string; text?: string }>;
  details?: T;
};

export type GatewayToolInvokeFailure = {
  ok: false;
  error: {
    type?: string;
    message: string;
  };
};

export type GatewayToolInvokeResponse<T> = GatewayToolInvokeSuccess<T> | GatewayToolInvokeFailure;
