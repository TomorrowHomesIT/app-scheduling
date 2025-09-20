import { Button } from "@/components/ui/button";
import { HardDrive } from "lucide-react";
import useJobStore from "@/store/job/job-store";
import useLoadingStore from "@/store/loading-store";

interface JobDriveSyncButtonProps {
  jobId: number;
  onCloseDialog: () => void;
}

export function JobDriveSyncButton({ jobId, onCloseDialog }: JobDriveSyncButtonProps) {
  const { syncJobWithDrive, currentJob } = useJobStore();
  const { currentJob: jobLoadingState } = useLoadingStore();

  const handleSync = async () => {
    onCloseDialog();
    await new Promise((resolve) => setTimeout(resolve, 200));
    await syncJobWithDrive(jobId);
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
