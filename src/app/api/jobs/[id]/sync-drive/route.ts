import { createClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/auth";
import { syncJobWithDrive } from "@/lib/api/drive-sync";

export const POST = withAuth(async (_, { params }: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient();
  const { id } = await params;
  const jobId = parseInt(id, 10);

  if (Number.isNaN(jobId)) {
    return Response.json({ error: "Invalid job ID" }, { status: 400 });
  }

  try {
    // First, check if the job exists
    const { data: jobData, error: jobError } = await supabase
      .from("cf_jobs")
      .select("id, name, google_drive_dir_id")
      .eq("id", jobId)
      .single();

    if (jobError || !jobData) {
      console.error("Error fetching job:", jobError);
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    // Sync the job with Google Drive
    const syncResult = await syncJobWithDrive(jobId, jobData.name, supabase);

    if (!syncResult.success) {
      return Response.json({ error: syncResult.error }, { status: 500 });
    }

    return Response.json(
      {
        success: true,
        message: "Job synced with Google Drive successfully",
        updatedTasks: syncResult.updatedTasks,
        googleDriveDirId: syncResult.googleDriveDirId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in POST /api/jobs/[id]/sync-drive:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
