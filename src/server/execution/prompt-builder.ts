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
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n");
}
