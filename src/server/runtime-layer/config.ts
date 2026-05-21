import fs from "node:fs";
import type { RuntimeLayerConfig } from "@/server/runtime-layer/types";

const DEFAULT_GATEWAY_URL = "http://127.0.0.1:18789";
const DEFAULT_TIMEOUT_MS = 120000;
const OPENCLAW_CONFIG_PATH = "/root/.openclaw/openclaw.json";

export type RuntimeLayerStatus = {
  gatewayUrl: string;
  gatewayReachability: "local" | "remote";
  tokenConfigured: boolean;
  timeoutMs: number;
  warning: string | null;
};

function readGatewayTokenFromLocalConfig() {
  try {
    const raw = fs.readFileSync(OPENCLAW_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      gateway?: {
        auth?: {
          token?: string;
        };
      };
    };
    return parsed.gateway?.auth?.token?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function getRuntimeLayerConfig(): RuntimeLayerConfig {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL?.trim() || DEFAULT_GATEWAY_URL;
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN?.trim() || readGatewayTokenFromLocalConfig();
  const timeoutMs = Number(process.env.OPENCLAW_RUNTIME_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  return {
    gatewayUrl,
    gatewayToken,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
  };
}

function isLocalGatewayUrl(gatewayUrl: string) {
  try {
    const parsed = new URL(gatewayUrl);
    return ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);
  } catch {
    return gatewayUrl.includes("127.0.0.1") || gatewayUrl.includes("localhost");
  }
}

export function getRuntimeLayerStatus(): RuntimeLayerStatus {
  const config = getRuntimeLayerConfig();
  const gatewayReachability = isLocalGatewayUrl(config.gatewayUrl) ? "local" : "remote";
  const hostedPreviewUsesLocalGateway = Boolean(process.env.VERCEL) && gatewayReachability === "local";

  return {
    gatewayUrl: config.gatewayUrl,
    gatewayReachability,
    tokenConfigured: Boolean(config.gatewayToken),
    timeoutMs: config.timeoutMs,
    warning: hostedPreviewUsesLocalGateway
      ? "This hosted preview is configured for a local OpenClaw gateway. Runtime dispatch needs a reachable gateway URL before live worker runs are reliable from Vercel."
      : null,
  };
}
