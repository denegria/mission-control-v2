import type { Settings } from "@/domain/schema";

export type ActorOption = {
  id: string;
  label: string;
};

const FALLBACK_ACTORS: ActorOption[] = [
  { id: "giuseppe", label: "Giuseppe" },
  { id: "cisco", label: "Cisco" },
  { id: "senior-builder", label: "Senior Builder" },
  { id: "sentry", label: "Sentry" },
];

export function getActorOptions(settings: Settings | null | undefined): ActorOption[] {
  return settings?.operators.actorRoster?.length ? settings.operators.actorRoster : FALLBACK_ACTORS;
}

export function getDefaultOperatorId(settings: Settings | null | undefined): string {
  return settings?.operators.defaultOperatorId ?? "giuseppe";
}

export function getDefaultOperatorLabel(settings: Settings | null | undefined): string {
  return settings?.operators.defaultOperatorLabel ?? "Giuseppe";
}

export function getActorLabel(actor: string | undefined, settings: Settings | null | undefined): string {
  if (!actor) {
    return "Unknown";
  }
  const match = getActorOptions(settings).find((option) => option.id === actor || option.label === actor);
  return match?.label ?? actor;
}
