import type { RuntimeLayerConfig } from "@/server/runtime-layer/types";
import { getRuntimeLayerConfig } from "@/server/runtime-layer/config";

export class RuntimeLayerClientError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "RuntimeLayerClientError";
    this.code = options?.code;
    this.status = options?.status;
  }
}

function buildHeaders(config: RuntimeLayerConfig, contentLength?: number) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (contentLength !== undefined) {
    headers["Content-Length"] = String(contentLength);
  }

  if (config.gatewayToken) {
    headers.Authorization = `Bearer ${config.gatewayToken}`;
  }

  return headers;
}

export async function postGatewayJson<T>(path: string, body: unknown, config = getRuntimeLayerConfig()): Promise<T> {
  const payload = JSON.stringify(body);
  const response = await fetch(new URL(path, config.gatewayUrl), {
    method: "POST",
    headers: buildHeaders(config, Buffer.byteLength(payload)),
    body: payload,
  });

  const text = await response.text();
  let parsed: unknown = undefined;

  if (text.trim()) {
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new RuntimeLayerClientError(`Gateway returned non-JSON response for ${path}`, { status: response.status });
    }
  }

  if (!response.ok) {
    const errorMessage =
      (parsed as { error?: { message?: string } } | undefined)?.error?.message ||
      response.statusText ||
      `Gateway request failed (${response.status})`;

    throw new RuntimeLayerClientError(errorMessage, { status: response.status });
  }

  return parsed as T;
}
