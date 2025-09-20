import type { SupabaseClient } from "@supabase/supabase-js";

const EXTERNAL_API_HOSTNAME = process.env.BASD_SERVICE_URL ?? "";
const SERVICE_TOKEN = process.env.BASD_SERVICE_TOKEN ?? "";

interface DriveFile {
  googleDriveId: string;
  name: string;
  docTag?: string;
}

interface ExternalApiResponse {
  poFile?: DriveFile;
  planFiles?: DriveFile[];
  lotDirId?: string;
}

interface SyncResult {
  success: boolean;
  error?: string;
  updatedTasks?: number;
  googleDriveDirId?: string;
}

interface JobTaskData {
  id: number;
  job_id: number;
  name: string;
  cost_center: number | null;
  doc_tags: string[] | null;
  purchase_order_links: DriveFile[] | null;
  plan_links: DriveFile[] | null;
}

interface ProcessTaskResult {
  updated: boolean;
  apiData: ExternalApiResponse | null;
  error?: string;
}

// Configuration
const BATCH_SIZE = 20; // Number of parallel requests per batch

// ================== HELPER FUNCTIONS ==================

// Helper to check if environment is configured
function checkEnvConfig(): { isValid: boolean; error?: string } {
  if (!EXTERNAL_API_HOSTNAME || !SERVICE_TOKEN) {
    return { isValid: false, error: "ENV variables are not set" };
  }
  return { isValid: true };
}

// Helper function to compare two arrays of DriveFile objects
function areLinksEqual(links1: DriveFile[], links2: DriveFile[]): boolean {
  if (links1.length !== links2.length) {
    return false;
  }

  // Sort both arrays by googleDriveId to ensure consistent comparison
  const sorted1 = [...links1].sort((a, b) => a.googleDriveId.localeCompare(b.googleDriveId));
  const sorted2 = [...links2].sort((a, b) => a.googleDriveId.localeCompare(b.googleDriveId));

  // Compare each item
  for (let i = 0; i < sorted1.length; i++) {
    if (
      sorted1[i].googleDriveId !== sorted2[i].googleDriveId ||
      sorted1[i].name !== sorted2[i].name ||
      sorted1[i].docTag !== sorted2[i].docTag
    ) {
      return false;
    }
  }

  return true;
}

// Fetch links from external API
async function fetchLinksFromExternalApi(
  jobName: string,
  costCenter: number,
  docTags: string[],
): Promise<ExternalApiResponse | null> {
  try {
    // Build URL with the job name and cost center
    let url = `${EXTERNAL_API_HOSTNAME}/THGScheduling/Automation/Files/${encodeURIComponent(jobName)}/${costCenter}`;

    // Add doc tags as query parameters
    if (docTags && docTags.length > 0) {
      const params = new URLSearchParams();
      for (const tag of docTags) {
        params.append("docTags", tag);
      }
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-App-Auth": SERVICE_TOKEN,
        Accept: "application/json",
      },
    });

    if (response.status === 404) {
      console.log(`No data found for ${jobName}/${costCenter}`);
      return null;
    }

    if (!response.ok) {
      console.error(`External API error ${response.status} for ${jobName}/${costCenter}`);
      return null;
    }

    let data = await response.json();
    try {
      data = JSON.parse(data);
    } catch {
      // Data is already parsed, ignore
    }

    return data;
  } catch (error) {
    console.error(`Error fetching from external API for ${jobName}/${costCenter}:`, error);
    return null;
  }
}

// Transform API response to our format
function transformApiResponse(data: ExternalApiResponse): {
  purchaseOrderLinks: DriveFile[];
  planLinks: DriveFile[];
} {
  const result = {
    purchaseOrderLinks: [] as DriveFile[],
    planLinks: [] as DriveFile[],
  };

  // Purchase order file - put it in an array
  if (data.poFile) {
    result.purchaseOrderLinks = [data.poFile];
  }

  // Plan files - already an array, use as-is
  if (data.planFiles && Array.isArray(data.planFiles)) {
    result.planLinks = data.planFiles;
  }

  return result;
}

// Process a single task - check and update if needed
async function processTask(task: JobTaskData, jobName: string, supabase: SupabaseClient): Promise<ProcessTaskResult> {
  // Skip tasks without a cost center
  if (!task.cost_center) {
    return { updated: false, apiData: null };
  }

  // Fetch data from external API
  const apiData = await fetchLinksFromExternalApi(jobName, task.cost_center, task.doc_tags || []);
  if (!apiData) {
    return { updated: false, apiData: null };
  }

  const transformed = transformApiResponse(apiData);

  // Check if we need to update - compare actual values
  const poLinksChanged = !areLinksEqual(transformed.purchaseOrderLinks, task.purchase_order_links || []);
  const planLinksChanged = !areLinksEqual(transformed.planLinks, task.plan_links || []);
  const needsUpdate = poLinksChanged || planLinksChanged;

  if (!needsUpdate) {
    return { updated: false, apiData };
  }

  console.log(`Task ${task.id}: Updating links`, {
    po: transformed.purchaseOrderLinks.length,
    plans: transformed.planLinks.length,
  });

  // Update the task with new links
  const { error: updateError } = await supabase
    .from("cf_job_tasks")
    .update({
      purchase_order_links: transformed.purchaseOrderLinks,
      plan_links: transformed.planLinks,
    })
    .eq("id", task.id);

  if (updateError) {
    console.error(`Error updating task ${task.id}:`, updateError);
    return { updated: false, apiData, error: updateError.message };
  }

  return { updated: true, apiData };
}

// Process a batch of tasks in parallel
async function processBatch(
  tasks: JobTaskData[],
  jobName: string,
  supabase: SupabaseClient,
): Promise<{ updates: number; googleDriveDirId?: string }> {
  let googleDriveDirId: string | undefined;
  let updatedCount = 0;

  // Process all tasks in this batch in parallel
  const results = await Promise.all(tasks.map((task) => processTask(task, jobName, supabase)));

  // Process results
  for (const result of results) {
    if (result.updated) {
      updatedCount++;
    }
    // Capture Google Drive directory ID if present
    if (result.apiData?.lotDirId && !googleDriveDirId) {
      googleDriveDirId = result.apiData.lotDirId;
    }
  }

  return { updates: updatedCount, googleDriveDirId };
}

// ================== MAIN FUNCTIONS ==================

// Sync all tasks for a job
export async function syncJobWithDrive(jobId: number, jobName: string, supabase: SupabaseClient): Promise<SyncResult> {
  try {
    // Check environment configuration
    const envCheck = checkEnvConfig();
    if (!envCheck.isValid) {
      return { success: false, error: envCheck.error };
    }

    console.log(`Starting sync for job ${jobId} (${jobName})`);

    // Fetch all tasks for this job
    const { data: tasksData, error: tasksError } = await supabase
      .from("cf_job_tasks")
      .select("id, job_id, name, cost_center, doc_tags, purchase_order_links, plan_links")
      .eq("job_id", jobId)
      .order("order");

    if (tasksError) {
      console.error("Error fetching job tasks:", tasksError);
      return { success: false, error: tasksError.message };
    }

    const tasks: JobTaskData[] = tasksData;
    if (!tasks || tasks.length === 0) {
      return { success: true, updatedTasks: 0 };
    }

    let totalUpdatedCount = 0;
    let googleDriveDirId: string | undefined;

    // Process tasks in batches
    const totalTasks = tasks.length;
    console.log(`Processing ${totalTasks} tasks in batches of ${BATCH_SIZE}`);

    for (let i = 0; i < totalTasks; i += BATCH_SIZE) {
      const batch = tasks.slice(i, Math.min(i + BATCH_SIZE, totalTasks));
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(totalTasks / BATCH_SIZE);

      console.log(
        `Processing batch ${batchNumber}/${totalBatches} (tasks ${i + 1}-${Math.min(i + BATCH_SIZE, totalTasks)})`,
      );

      const { updates, googleDriveDirId: batchDriveId } = await processBatch(batch, jobName, supabase);

      totalUpdatedCount += updates;
      if (batchDriveId && !googleDriveDirId) {
        googleDriveDirId = batchDriveId;
      }

      // Small delay between batches to avoid overwhelming the API
      if (i + BATCH_SIZE < totalTasks) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`Sync completed: ${totalUpdatedCount} tasks updated`);

    // Update the job with Google Drive directory ID if we found one
    if (googleDriveDirId) {
      console.log(`Updating job with Google Drive ID: ${googleDriveDirId}`);
      const { error: jobUpdateError } = await supabase
        .from("cf_jobs")
        .update({ google_drive_dir_id: googleDriveDirId })
        .eq("id", jobId);

      if (jobUpdateError) {
        console.error(`Error updating job with Google Drive ID:`, jobUpdateError);
      }
    }

    return {
      success: true,
      updatedTasks: totalUpdatedCount,
      googleDriveDirId,
    };
  } catch (error) {
    console.error("Error in syncJobWithDrive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Sync a single task
export async function syncTaskWithDrive(
  task: JobTaskData,
  jobName: string,
  supabase: SupabaseClient,
): Promise<{ success: boolean; error?: string; updated?: boolean; task?: JobTaskData }> {
  try {
    const envCheck = checkEnvConfig();
    if (!envCheck.isValid) {
      return { success: false, error: envCheck.error };
    }

    const result = await processTask(task, jobName, supabase);
    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, updated: result.updated };
  } catch (error) {
    console.error("Error in syncTaskWithDrive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
