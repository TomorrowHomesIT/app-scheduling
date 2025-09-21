import { createClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/auth";
import { syncTaskWithDrive } from "@/lib/api/drive-sync";

export const POST = withAuth(async (_, { params }: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient();
  const { id } = await params;
  const taskId = parseInt(id, 10);

  if (Number.isNaN(taskId)) {
    return Response.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    const { data: taskData, error: taskError } = await supabase
      .from("cf_job_tasks")
      .select("id, job_id, name, cost_center, doc_tags, purchase_order_links, plan_links")
      .eq("id", taskId)
      .single();

    if (taskError || !taskData) {
      console.error("Error fetching task:", taskError);
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    // Then fetch the job name
    const { data: jobData, error: jobError } = await supabase
      .from("cf_jobs")
      .select("name")
      .eq("id", taskData.job_id)
      .single();

    if (jobError || !jobData) {
      console.error("Error fetching job:", jobError);
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    const jobName = jobData.name;

    // Sync the single task with Google Drive
    const syncResult = await syncTaskWithDrive(taskData, jobName, supabase);

    if (!syncResult.success) {
      return Response.json({ error: syncResult.error }, { status: 500 });
    }

    return Response.json(
      {
        success: true,
        message: syncResult.updated ? "Task synced with Google Drive successfully" : "Task already up to date",
        updated: syncResult.updated,
        task: syncResult.task,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in POST /api/jobs/tasks/[id]/sync-drive:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
