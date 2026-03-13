export type RuntimeWorkerSessionLink = {
  runId: string;
  sessionId?: string;
  sessionKey?: string;
  resumeSessionId?: string;
};

export function createRuntimeWorkerSessionLink(link: RuntimeWorkerSessionLink) {
  return link;
}
