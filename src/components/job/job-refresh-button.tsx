import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast-store";
import useJobStore from "@/store/job/job-store";
import { useState } from "react";

interface JobRefreshButtonProps {
  jobId: number;
}

export function JobRefreshButton({ jobId }: JobRefreshButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { currentJob, refreshJob, forceSyncLocalJob } = useJobStore();

  if (!currentJob?.lastSynced || !currentJob.lastUpdated) {
    return null;
  }

  const hasPendingUpdates = currentJob.lastUpdated > currentJob.lastSynced;
  
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (hasPendingUpdates) {
        // Force refresh: sync pending changes then refresh
        await toast.while(forceSyncLocalJob(jobId), {
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
      console.error("Refresh failed:", error);
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
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} ${hasPendingUpdates ? "text-orange-500" : ""}`} />
    </Button>
  );
}
