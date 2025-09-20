import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import { validateJobTaskUrls } from "@/lib/api/validation";
import { withAuth } from "@/lib/api/auth";
import type { IJobTask } from "@/models/job.model";

export const PATCH = withAuth(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient();
  const { id } = await params;
  const taskId = parseInt(id, 10);

  if (Number.isNaN(taskId)) {
    return Response.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    const updates = await request.json();

    // Validate purchaseOrderLinks if provided
    if (updates.purchaseOrderLinks !== undefined) {
      const poValidationError = validateJobTaskUrls(updates.purchaseOrderLinks);
      if (poValidationError) {
        return Response.json({ error: `Invalid purchase order links: ${poValidationError}` }, { status: 400 });
      }
    }

    // Validate planLinks if provided
    if (updates.planLinks !== undefined) {
      const planValidationError = validateJobTaskUrls(updates.planLinks);
      if (planValidationError) {
        return Response.json({ error: `Invalid plan links: ${planValidationError}` }, { status: 400 });
      }
    }

    // Prepare the update object for snake_case columns
    // biome-ignore lint/suspicious/noExplicitAny: its a snake case database object
    const updateData: any = {};

    // Use 'in' operator to check if property exists, pass values directly (including null)
    if ("name" in updates) updateData.name = updates.name;
    if ("supplierId" in updates) updateData.supplier_id = updates.supplierId;
    if ("costCenter" in updates) updateData.cost_center = updates.costCenter;
    if ("progress" in updates) updateData.progress = updates.progress;
    if ("status" in updates) updateData.status = updates.status;
    if ("stageId" in updates) updateData.task_stage_id = updates.stageId;
    if ("docTags" in updates) updateData.doc_tags = updates.docTags;
    if ("notes" in updates) updateData.notes = updates.notes;
    if ("startDate" in updates) updateData.start_date = updates.startDate;
    if ("purchaseOrderLinks" in updates) updateData.purchase_order_links = updates.purchaseOrderLinks;
    if ("planLinks" in updates) updateData.plan_links = updates.planLinks;
    if ("order" in updates) updateData.order = updates.order;

    // Update task in cf_job_tasks table
    const { data, error } = await supabase.from("cf_job_tasks").update(updateData).eq("id", taskId).select().single();

    if (!data || error) {
      console.error("Error updating task:", error);
      return Response.json({ error }, { status: 500 });
    }

    const updatedTask: IJobTask = toCamelCase(data) as IJobTask;

    // Map the response to match IJobTask interface
    const mappedTask: IJobTask = {
      ...updatedTask,
      startDate: updatedTask.startDate ? new Date(updatedTask.startDate) : null,
      purchaseOrderLinks: updatedTask.purchaseOrderLinks || [],
      planLinks: updatedTask.planLinks || [],
    };

    return Response.json(mappedTask, { status: 200 });
  } catch (error) {
    console.error("Error in PATCH /api/jobs/tasks/[id]:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
