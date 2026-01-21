export type TaskFrequency = "daily" | "weekly" | "monthly";

export type TaskStatus = "completed" | "missed" | "pending";

export type Task = {
  id: string;
  title: string;
  description?: string;
  frequency: TaskFrequency;
  createdAt: string; // ISO date
  active: boolean;
};

export type TaskCompletion = {
  date: string; // YYYY-MM-DD
  status: TaskStatus;
};

export type TaskWithCompletions = Task & {
  completions: Record<string, TaskStatus>; // key: YYYY-MM-DD
};


