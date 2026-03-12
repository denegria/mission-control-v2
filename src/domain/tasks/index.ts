import type { Priority, ProtocolMessage, Task, TaskStatus } from "@/domain/schema";

export type { Task, TaskStatus, Priority, ProtocolMessage };

export type TaskWorkboardItem = Pick<Task, "id" | "title" | "owner" | "status" | "priority" | "updatedAt"> & {
  linkedProjectIds: string[];
  flowCount: number;
  pendingApprovals: number;
  blockedFlows: number;
};

export type TaskDetail = Task & {
  linkedProjectIds: string[];
};

export type ProtocolExceptionInboxItem = {
  protocolMessage: ProtocolMessage;
  taskId: string;
  taskTitle: string;
  flowTitle?: string;
};
