import type { IJob, IJobTask } from "@/models/job.model";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toCamelCase } from "./casing";

interface IJobDbData {
  id: number;
  name: string;
  location: string;
  google_drive_dir_id: string | null;
  owner_id: number;
}

export async function getJobWithTasks(jobData: IJobDbData, supabase: SupabaseClient): Promise<IJob> {
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
    .eq("job_id", jobData.id)
    .order("order");

  if (tasksError) {
    console.error("Error fetching job tasks:", tasksError);
    throw new Error(tasksError.message);
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

  return completeJob;
}
