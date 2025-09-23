import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import useJobStore from "@/store/job/job-store";
import useJobSyncStore from "@/store/job/job-sync-store";

export function JobSyncStatus() {
  const { currentJob } = useJobStore();
  const { syncState } = useJobSyncStore();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every minute to refresh the "time ago" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000); // Check for changes every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Only show if we have a job with sync status (from local DB)
  if (!currentJob || !currentJob.lastUpdated) {
    return;
  }

  const lastUpdated = currentJob.lastUpdated;
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date(currentTime);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusText = () => {
    if (syncState.isSyncing) {
      return "Syncing";
    }
    return `Updated ${formatTime(lastUpdated)}`;
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>{getStatusText()}</span>
      </div>
    </div>
  );
}
