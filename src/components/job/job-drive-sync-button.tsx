import { Button } from "@/components/ui/button";
import { HardDrive } from "lucide-react";
import { toast } from "@/store/toast-store";
import useJobStore from "@/store/job/job-store";
import useLoadingStore from "@/store/loading-store";

interface JobDriveSyncButtonProps {
  jobId: number;
  onCloseDialog: () => void;
}

export function JobDriveSyncButton({ jobId, onCloseDialog }: JobDriveSyncButtonProps) {
  const { loadJob, currentJob } = useJobStore();
  const { currentJob: jobLoadingState, setLoading } = useLoadingStore();

  const handleSync = async () => {
    onCloseDialog();

    await new Promise((resolve) => setTimeout(resolve, 300));

    setLoading("currentJob", true, "Syncing with Google Drive. This may take a while...");

    try {
      const response = await fetch(`/api/jobs/${jobId}/sync-drive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync with Google Drive");
      }

      toast.success(`Updated ${data.updatedTasks || 0} task(s) with Google Drive links`, 5000);
      setLoading("currentJob", false);

      // Reload the job to show updated data
      await loadJob(jobId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync with Google Drive");
      setLoading("currentJob", false);
    }
  };

  if (!currentJob?.googleDriveDirId) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleSync}
      title="Sync with Google Drive"
      disabled={jobLoadingState.isLoading}
    >
      <HardDrive className="h-4 w-4" />
      Sync Drive
    </Button>
  );
}
