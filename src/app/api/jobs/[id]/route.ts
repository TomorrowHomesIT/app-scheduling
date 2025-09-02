import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import type { IJob, IJobTask } from "@/models/job.model";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
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
      .select("id, name, owner_id")
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
      id: job.id,
      name: job.name,
      tasks: mappedTasks,
    };

    return Response.json(completeJob, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/jobs/[id]:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
