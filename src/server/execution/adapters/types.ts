import type { Flow, Run, RunWorkerLink, Task } from "@/domain/schema";

export type ExecutionAdapterSuccess = {
  ok: true;
  finalOutput: string;
  summary?: string;
  rawOutput?: string;
  workerLink?: RunWorkerLink;
};

export type ExecutionAdapterFailure = {
  ok: false;
  message: string;
  code?: string;
  retryable?: boolean;
  rawOutput?: string;
  workerLink?: RunWorkerLink;
};

export type ExecutionAdapterResult = ExecutionAdapterSuccess | ExecutionAdapterFailure;

export type ExecutionAdapterContext = {
  run: Run;
  task: Task;
  flow: Flow;
};

export type ExecutionAdapter = {
  execute(context: ExecutionAdapterContext): Promise<ExecutionAdapterResult>;
};
