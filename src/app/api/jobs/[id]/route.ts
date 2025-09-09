import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import { withAuth } from "@/lib/api/auth";
import type { IJob, IJobTask, IUpdateJobRequest } from "@/models/job.model";

export const GET = withAuth(async (_, { params }: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient();
  const { id } = await params;
  const jobId = parseInt(id, 10);

  if (Number.isNaN(jobId)) {
    return Response.json({ error: "Invalid job ID" }, { status: 400 });
  }

  try {
    // Fetch job from cf_jobs table
    const { data: jobData, error: jobError } = await supabase
      .from("cf_jobs")
      .select("id, name, location, owner_id, google_drive_dir_id")
      .eq("id", jobId)
      .single();

    if (jobError || !jobData) {
      console.error("Error fetching job:", jobError);
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    // Fetch tasks for this job from cf_job_tasks table
    const { data: tasksData, error: tasksError } = await supabase
      .from("cf_job_tasks")
      .select(`
        id,
        job_id,
        name,
        supplier_id,
        cost_center,
        progress,
        status,
        task_stage_id,
        doc_tags,
        notes,
        start_date,
        purchase_order_links,
        plan_links,
        order
      `)
      .eq("job_id", jobId)
      .order("order");

    if (tasksError) {
      console.error("Error fetching job tasks:", tasksError);
      return Response.json({ error: tasksError }, { status: 500 });
    }

    // Convert to camelCase
    const job = toCamelCase(jobData);
    const tasks: IJobTask[] = toCamelCase(tasksData || []);

    // Map task fields to match IJobTask interface
    const mappedTasks = tasks.map((task) => ({
      ...task,
      startDate: task.startDate ? new Date(task.startDate) : null,
      purchaseOrderLinks: task.purchaseOrderLinks || [],
      planLinks: task.planLinks || [],
    }));

    // Construct the complete job object
    const completeJob: IJob = {
      ...job,
      tasks: mappedTasks,
    };

    return Response.json(completeJob, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/jobs/[id]:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient();
  const { id } = await params;
  const jobId = parseInt(id, 10);

  if (Number.isNaN(jobId)) {
    return Response.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const updates: IUpdateJobRequest = await request.json();
  if (!updates.name || !updates.name.trim()) {
    return Response.json({ error: "Job name is required" }, { status: 400 });
  }

  const updateData: Record<string, string | null | number> = {
    name: updates.name.trim(),
    location: updates.location?.trim() || null,
    owner_id: updates.ownerId,
  };

  // Update job in cf_jobs table
  const { data: jobData, error: jobError } = await supabase
    .from("cf_jobs")
    .update(updateData)
    .eq("id", jobId)
    .select("id, name, location, owner_id")
    .single();

  if (jobError || !jobData) {
    console.error("Error updating job:", jobError);
    return Response.json({ error: "Failed to update job" }, { status: 500 });
  }

  return Response.json(true, { status: 200 });
});
