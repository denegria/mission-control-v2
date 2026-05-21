import type { RunAdapter } from "@/domain/schema";
import type { Settings } from "@/domain/schema";
import { getActorLabel } from "@/lib/actors";

export type RuntimeFamily = "openai" | "gemini";

export type ExecutionPlan = {
  actorLabel: string;
  family: RuntimeFamily;
  agent: "codex" | "gemini";
  adapter: RunAdapter;
  allowedAdapters: RunAdapter[];
  preferredAdapter: RunAdapter;
  transportLabel: "native runtime bridge" | "legacy acpx session";
  runtimeLabel: string;
};

function normalizeActor(actor: string | undefined, settings?: Settings | null) {
  const label = getActorLabel(actor, settings).trim();
  const id = actor?.trim().toLowerCase() ?? "";
  const normalizedLabel = label.toLowerCase();
  return { id, label, normalizedLabel };
}

function isGeminiActor(actor: string | undefined, settings?: Settings | null) {
  const normalized = normalizeActor(actor, settings);
  return [normalized.id, normalized.normalizedLabel].some((value) =>
    ["senior-builder", "senior builder", "cisco", "sentry"].includes(value),
  );
}

export function getExecutionPlan(input: {
  actor: string | undefined;
  settings?: Settings | null;
  requestedAdapter?: string | null;
}): ExecutionPlan {
  const actorLabel = getActorLabel(input.actor, input.settings);
  const geminiFamily = isGeminiActor(input.actor, input.settings);

  const family: RuntimeFamily = geminiFamily ? "gemini" : "openai";
  const allowedAdapters: RunAdapter[] = geminiFamily
    ? ["native_acp_gemini"]
    : ["native_acp_codex", "acpx_codex"];

  const preferredAdapter: RunAdapter = geminiFamily ? "native_acp_gemini" : "native_acp_codex";
  const requestedAdapter = input.requestedAdapter?.trim() as RunAdapter | undefined;
  const adapter = requestedAdapter && allowedAdapters.includes(requestedAdapter) ? requestedAdapter : preferredAdapter;

  if (adapter === "native_acp_gemini") {
    return {
      actorLabel,
      family,
      agent: "gemini",
      adapter,
      allowedAdapters,
      preferredAdapter,
      transportLabel: "native runtime bridge",
      runtimeLabel: "Native Gemini",
    };
  }

  if (adapter === "acpx_gemini") {
    return {
      actorLabel,
      family,
      agent: "gemini",
      adapter: "native_acp_gemini",
      allowedAdapters,
      preferredAdapter,
      transportLabel: "native runtime bridge",
      runtimeLabel: "Native Gemini",
    };
  }

  if (adapter === "native_acp_codex") {
    return {
      actorLabel,
      family,
      agent: "codex",
      adapter,
      allowedAdapters,
      preferredAdapter,
      transportLabel: "native runtime bridge",
      runtimeLabel: "Native Codex",
    };
  }

  return {
    actorLabel,
    family,
    agent: "codex",
    adapter: "acpx_codex",
    allowedAdapters,
    preferredAdapter,
    transportLabel: "legacy acpx session",
    runtimeLabel: "Legacy Codex",
  };
}
