import { createClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/auth";
import type { IJob } from "@/models/job.model";
import { getJobWithTasks } from "@/lib/api/job-with-task";

export const GET = withAuth(async (_) => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Fetch the owner from the userId

    const { data: ownerData, error: ownerError } = await supabase
      .from("cf_owners")
      .select("id, user_id")
      .eq("user_id", userId)
      .single();

    if (ownerError || !ownerData) {
      return Response.json({ error: "Owner not found" }, { status: 404 });
    }

    // Get all jobs for the owner
    const { data: jobData, error: jobError } = await supabase
      .from("cf_jobs")
      .select("id, name, location, owner_id, google_drive_dir_id")
      .eq("owner_id", ownerData.id);

    if (jobError) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    } else if (!jobData?.length) {
      return Response.json([], { status: 200 });
    }

    const jobDTOs: IJob[] = [];
    for (const job of jobData) {
      const completeJob = await getJobWithTasks(job, supabase);
      jobDTOs.push(completeJob);
    }

    return Response.json(jobDTOs, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/user/jobs:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
