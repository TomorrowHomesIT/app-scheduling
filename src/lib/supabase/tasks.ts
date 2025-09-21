import { createClient } from "@/lib/supabase/client";
import { toCamelCase } from "@/lib/api/casing";
import type { ITask, ITaskEditUpdates } from "@/models/task.model";

export async function getTasks(): Promise<ITask[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cf_tasks")
    .select("id, name, cost_center, doc_tags, order, task_stage_id")
    .order("order");

  if (!data || error) {
    throw new Error(error?.message || "Failed to fetch tasks");
  }

  const tasks: ITask[] = toCamelCase(data);
  return tasks;
}

export async function updateTask(taskId: number, updates: ITaskEditUpdates): Promise<ITask> {
  const supabase = createClient();

  if (Number.isNaN(taskId)) {
    throw new Error("Invalid task ID");
  }

  const dbUpdates: Record<string, number | string | string[] | null> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.costCenter !== undefined) dbUpdates.cost_center = updates.costCenter;
  if (updates.docTags !== undefined) dbUpdates.doc_tags = updates.docTags;

  const { data, error } = await supabase.from("cf_tasks").update(dbUpdates).eq("id", taskId).select().single();

  if (error) {
    throw new Error(error.message || "Failed to update task");
  }

  if (!data) {
    throw new Error("Task not found");
  }

  const camelCaseData: ITask = toCamelCase<ITask>(data);

  return camelCaseData;
}
