import fs from "node:fs";
import type { RuntimeLayerConfig } from "@/server/runtime-layer/types";

const DEFAULT_GATEWAY_URL = "http://127.0.0.1:18789";
const DEFAULT_TIMEOUT_MS = 120000;
const OPENCLAW_CONFIG_PATH = "/root/.openclaw/openclaw.json";

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
