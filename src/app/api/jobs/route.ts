import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import { withAuth } from "@/lib/api/auth";
import type { ICreateJobRequest } from "@/models/job.model";

export const POST = withAuth(async (request) => {
  const supabase = await createClient();

  try {
    const body: ICreateJobRequest = await request.json();
    const { name, location, ownerId, tasks } = body;

    // Start a transaction by creating the job first
    const { data: jobData, error: jobError } = await supabase
      .from("cf_jobs")
      .insert({
        name,
        location,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (jobError || !jobData) {
      console.error("Error creating job:", jobError);
      return Response.json({ error: jobError }, { status: 500 });
    }

    // Prepare tasks for bulk insert
    const jobTasks = tasks.map((task) => ({
      job_id: jobData.id,
      task_stage_id: task.taskStageId,
      name: task.name,
      doc_tags: task.docTags,
      order: task.order,
      cost_center: task.costCenter,
    }));

    // Insert all tasks for this job
    const { error: tasksError } = await supabase.from("cf_job_tasks").insert(jobTasks);

    if (tasksError) {
      console.error("Error creating job tasks:", tasksError);
      // Ideally, we should rollback the job creation here
      // but Supabase doesn't have built-in transaction support
      return Response.json({ error: tasksError }, { status: 500 });
    }

    // Return the created job
    const createdJob = toCamelCase(jobData);
    return Response.json(createdJob, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/jobs:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const GET = withAuth(async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.from("cf_jobs").select("id, name, owner_id").order("name");

  if (!data || error) {
    return Response.json({ error }, { status: 500 });
  }

  const jobs = toCamelCase(data);
  return Response.json(jobs, { status: 200 });
});
