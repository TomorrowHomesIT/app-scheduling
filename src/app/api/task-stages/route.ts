import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import type { IJobTaskStage } from "@/models/job.model";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("cf_task_stages").select("id, name, order").order("order");

  if (!data || error) {
    return Response.json({ error }, { status: 500 });
  }

  const stages: IJobTaskStage[] = toCamelCase(data);
  return Response.json(stages, { status: 200 });
}
