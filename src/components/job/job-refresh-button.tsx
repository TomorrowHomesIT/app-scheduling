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
  const { currentJob, refreshJob } = useJobStore();

  if (!currentJob?.lastSynced || !currentJob.lastUpdated) {
    return null;
  }

  const hasPendingUpdates = currentJob.lastUpdated > currentJob.lastSynced;
  const handleRefresh = async () => {
    if (hasPendingUpdates) {
      toast.error("Cannot refresh while there are pending updates. Please sync your changes first.");
      return;
    }

    setIsLoading(true);
    try {
      await toast.while(refreshJob(jobId), {
        loading: "Refreshing job...",
        success: "Job refreshed successfully",
        error: "Failed to refresh job",
      });
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={hasPendingUpdates || isLoading}>
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
    </Button>
  );
}
