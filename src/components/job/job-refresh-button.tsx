import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast-store";
import useJobStore from "@/store/job/job-store";
import { useState, useEffect } from "react";
import { offlineQueue } from "@/lib/offline-queue";
import logger from "@/lib/logger";

interface JobRefreshButtonProps {
  jobId: number;
}

export function JobRefreshButton({ jobId }: JobRefreshButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingInQueue, setHasPendingInQueue] = useState(false);
  const { currentJob, refreshJob, syncAndRefreshJob } = useJobStore();

  // Check queue for pending requests for this job
  useEffect(() => {
    const checkQueue = async () => {
      const hasPending = await offlineQueue.jobHasPendingRequests(jobId);
      setHasPendingInQueue(hasPending);
    };

    checkQueue();
    // Re-check every 2 seconds to catch queue changes
    const interval = setInterval(checkQueue, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  if (!currentJob) {
    return null;
  }

  // Check both queue and local changes
  const hasPendingUpdates = hasPendingInQueue;

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (hasPendingUpdates) {
        // Force refresh: sync pending changes then refresh
        await toast.while(syncAndRefreshJob(jobId), {
          loading: "Syncing changes and refreshing job...",
          success: "Job synced and refreshed successfully",
          error: "Failed to sync and refresh job",
        });
      } else {
        // Regular refresh: just fetch fresh data
        await toast.while(refreshJob(jobId), {
          loading: "Refreshing job...",
          success: "Job refreshed successfully",
          error: "Failed to refresh job",
        });
      }
    } catch (error) {
      logger.error("Job refresh failed", { jobId, error: JSON.stringify(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleRefresh}
      disabled={isLoading}
      title={hasPendingUpdates ? "Sync changes and refresh" : "Refresh job"}
    >
      <RefreshCw
        className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} ${hasPendingUpdates ? "text-orange-500" : ""}`}
      />
    </Button>
  );
}
