import { dprTaskTemplates } from "@/constants/dprTasks";

export type PlanTask = {
  id: string;
  label: string;
  qty: string;
  worker: string;
};

// Only `qty`/`worker` are user-editable - `id`/`label` come from the fixed
// dprTaskTemplates list and are never something the user changes, so they're
// deliberately left out of the dirty comparison.
export type TaskSnapshot = Record<string, { qty: string; worker: string }>;

export function blankTasks(): PlanTask[] {
  return dprTaskTemplates.map((task) => ({ ...task, qty: "", worker: "" }));
}

export function normalizeTasks(tasks: PlanTask[]): TaskSnapshot {
  return Object.fromEntries(tasks.map((task) => [task.id, { qty: task.qty, worker: task.worker }]));
}
