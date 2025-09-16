"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast-store";
import useJobStore from "@/store/job/job-store";

interface JobRefreshButtonProps {
  jobId: number;
}

export function JobRefreshButton({ jobId }: JobRefreshButtonProps) {
  const { currentJobSyncStatus, isLoadingJobs, refreshJob } = useJobStore();

  if (!currentJobSyncStatus) {
    return null;
  }

  const hasPendingUpdates = currentJobSyncStatus.hasPendingUpdates;
  const isLoading = isLoadingJobs;
  const handleRefresh = async () => {
    if (hasPendingUpdates) {
      toast.error("Cannot refresh while there are pending updates. Please sync your changes first.");
      return;
    }

    try {
      await toast.while(refreshJob(jobId), {
        loading: "Refreshing job...",
        success: "Job refreshed successfully",
        error: "Failed to refresh job",
      });
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={hasPendingUpdates || isLoading}>
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
    </Button>
  );
}
