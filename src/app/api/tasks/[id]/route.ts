import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/auth";
import { toCamelCase } from "@/lib/api/casing";
import type { ITaskEditUpdates } from "@/components/modals/task-edit/task-edit-modal";

export const PATCH = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const supabase = await createClient();
  const taskId = parseInt(params.id, 10);

  if (Number.isNaN(taskId)) {
    return Response.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    const updates: ITaskEditUpdates = await request.json();

    const dbUpdates: Record<string, number | string | string[] | null> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.costCenter !== undefined) dbUpdates.cost_center = updates.costCenter;
    if (updates.docTags !== undefined) dbUpdates.doc_tags = updates.docTags;

    const { data, error } = await supabase
      .from("cf_tasks")
      .update(dbUpdates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error updating task template:", error);
      return Response.json({ error: error.message }, { status: 500 });
    } else if (!data) {
      return Response.json({ error: "Task template not found" }, { status: 404 });
    }

    const camelCaseData = toCamelCase(data);
    return Response.json(camelCaseData);
  } catch (error) {
    console.error("Error in task template update:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});