import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import type { ITask } from "@/models/task.model";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cf_tasks")
    .select("id, name, cost_center, doc_tags, order, task_stage_id")
    .order("order");

  if (!data || error) {
    return Response.json({ error }, { status: 500 });
  }

  const tasks: ITask[] = toCamelCase(data);
  return Response.json(tasks, { status: 200 });
}
