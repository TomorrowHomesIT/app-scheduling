"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast-store";

interface JobRefreshButtonProps {
  jobId: number;
  hasPendingUpdates: boolean;
  isLoading: boolean;
  onRefresh: (jobId: number) => Promise<void>;
}

export function JobRefreshButton({ jobId, hasPendingUpdates, isLoading, onRefresh }: JobRefreshButtonProps) {
  const handleRefresh = async () => {
    if (hasPendingUpdates) {
      toast.error("Cannot refresh while there are pending updates. Please sync your changes first.");
      return;
    }

    try {
      await toast.while(onRefresh(jobId), {
        loading: "Refreshing job...",
        success: "Job refreshed successfully",
        error: "Failed to refresh job",
      });
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleRefresh}
      disabled={hasPendingUpdates || isLoading}
      className="h-8 w-8"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
    </Button>
  );
}
