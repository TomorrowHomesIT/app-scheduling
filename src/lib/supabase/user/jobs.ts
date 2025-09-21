import { createClient } from "@/lib/supabase/client";
import type { IJob } from "@/models/job.model";
import { getJobWithTasks } from "@/lib/api/job-with-task";

export async function getUserJobs(): Promise<IJob[]> {
  const supabase = createClient();

  // Get the current user
  // TODO we could probably pass the client claims here or at least the auth store user id
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not found");
  }

  // Fetch the owner from the userId
  const { data: ownerData, error: ownerError } = await supabase
    .from("cf_owners")
    .select("id, user_id")
    .eq("user_id", user.id)
    .single();

  if (ownerError || !ownerData) {
    throw new Error("Owner not found");
  }

  // Get all jobs for the owner
  const { data: jobData, error: jobError } = await supabase
    .from("cf_jobs")
    .select("id, name, location, owner_id, google_drive_dir_id")
    .eq("owner_id", ownerData.id);

  if (jobError) {
    throw new Error(jobError.message || "Failed to fetch jobs");
  }

  if (!jobData?.length) {
    return [];
  }

  const jobDTOs: IJob[] = [];
  for (const job of jobData) {
    const completeJob = await getJobWithTasks(job, supabase);
    jobDTOs.push(completeJob);
  }

  return jobDTOs;
}
