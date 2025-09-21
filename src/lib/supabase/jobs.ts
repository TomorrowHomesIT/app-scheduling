import { createClient } from "@/lib/supabase/client";
import { toCamelCase } from "@/lib/api/casing";
import type { IJob, ICreateJobRequest, IUpdateJobRequest } from "@/models/job.model";
import { getJobWithTasks } from "@/lib/api/job-with-task";

export async function getJobs() {
  const supabase = createClient();

  const { data, error } = await supabase.from("cf_jobs").select("id, name, owner_id").order("name");

  if (!data || error) {
    throw new Error(error?.message || "Failed to fetch jobs");
  }

  const jobs = toCamelCase(data);
  return jobs;
}

export async function getJobById(jobId: number): Promise<IJob> {
  const supabase = createClient();

  const { data: jobData, error: jobError } = await supabase
    .from("cf_jobs")
    .select("id, name, location, owner_id, google_drive_dir_id")
    .eq("id", jobId)
    .single();

  if (jobError || !jobData) {
    throw new Error(jobError?.message);
  }

  const completeJob: IJob = await getJobWithTasks(jobData, supabase);
  return completeJob;
}

export async function createJob(jobData: ICreateJobRequest): Promise<IJob> {
  const supabase = createClient();
  const { name, location, ownerId, tasks } = jobData;

  // Start by creating the job first
  const { data: newJobData, error: jobError } = await supabase
    .from("cf_jobs")
    .insert({
      name,
      location,
      owner_id: ownerId,
    })
    .select()
    .single();

  if (jobError || !newJobData) {
    throw new Error(jobError?.message || "Failed to create job");
  }

  // Prepare tasks for bulk insert
  const jobTasks = tasks.map((task) => ({
    job_id: newJobData.id,
    task_stage_id: task.taskStageId,
    name: task.name,
    doc_tags: task.docTags,
    order: task.order,
    cost_center: task.costCenter,
  }));

  // Insert all tasks for this job
  const { error: tasksError } = await supabase.from("cf_job_tasks").insert(jobTasks);
  if (tasksError) {
    throw new Error(tasksError.message || "Failed to create job tasks");
  }

  // Return the created job
  const createdJob = toCamelCase<IJob>(newJobData);
  return createdJob;
}

export async function updateJob(jobId: number, updates: IUpdateJobRequest): Promise<boolean> {
  const supabase = createClient();

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
    throw new Error(jobError?.message || "Failed to update job");
  }

  return true;
}
