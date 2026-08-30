import { dprTaskTemplates } from "@/constants/dprTasks";

export type PlanTask = {
  id: string;
  label: string;
  qty: string;
  worker: string;
};

export type TaskSnapshot = Record<string, { qty: string; worker: string }>;

export function blankTasks(): PlanTask[] {
  return dprTaskTemplates.map((task) => ({ ...task, qty: "", worker: "" }));
}

export function normalizeTasks(tasks: PlanTask[]): TaskSnapshot {
  return Object.fromEntries(tasks.map((task) => [task.id, { qty: task.qty, worker: task.worker }]));
}
