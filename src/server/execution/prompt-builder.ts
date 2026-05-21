import type { Flow, Task } from "@/domain/schema";

function block(label: string, value?: string | string[]) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  if (Array.isArray(value)) {
    return `${label}:\n${value.map((item) => `- ${item}`).join("\n")}`;
  }

  return `${label}: ${value}`;
}

export function buildFlowExecutionPrompt(input: { task: Task; flow: Flow }) {
  const { task, flow } = input;

  return [
    "Mission Control execution run",
    "",
    block("Task title", task.title),
    block("Task objective", task.objective),
    block("Flow title", flow.title),
    block("Flow objective", flow.objective),
    block("Owner", flow.owner),
    block("Task summary", task.summary),
    block("Flow summary", flow.summary),
    block("Task acceptance criteria", task.acceptanceCriteria),
    block("Flow inputs", flow.inputs),
    block("Flow expected outputs", flow.outputs),
    block("Task tags", task.tags),
    "",
    "Execution rules:",
    "- Do the requested work and keep the response concise but concrete.",
    "- If you changed code/config/docs, say exactly what changed.",
    "- If something is blocked, say exactly what is blocked and why.",
    "- End your response with machine-readable scorecard and closure blocks using this exact format:",
    "",
    "SCORECARD:",
    "validation:",
    "- <command/result or none>",
    "changed_files:",
    "- <path or none>",
    "review:",
    "- <reviewer/next step or none>",
    "artifacts:",
    "- <branch/commit/pr/link or none>",
    "",
    "CLOSURE:",
    "outcome: <done|approved|review|blocked>",
    "summary: <one short sentence>",
    "",
    "Closure guidance:",
    "- Use 'done' when the flow work is complete and ready for review.",
    "- Use 'approved' only when the review/approval outcome is explicitly approved.",
    "- Use 'review' when work is complete but needs human or QA review.",
    "- Use 'blocked' when the flow cannot proceed.",
    "- Always include the CLOSURE block as the final lines of your response.",
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n");
}
