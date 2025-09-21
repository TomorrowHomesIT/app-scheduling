import { createClient } from "@/lib/supabase/client";
import { toCamelCase } from "@/lib/api/casing";
import type { IJobTaskStage } from "@/models/job.model";

export async function getTaskStages(): Promise<IJobTaskStage[]> {
  const supabase = createClient();

  const { data, error } = await supabase.from("cf_task_stages").select("id, name, order").order("order");

  if (!data || error) {
    throw new Error(error?.message || "Failed to fetch task stages");
  }

  const stages: IJobTaskStage[] = toCamelCase(data);
  return stages;
}
