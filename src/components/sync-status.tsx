import { Clock, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import useJobSyncStore from "@/store/job/job-sync-store";

export function SyncStatus() {
  const { syncState, lastSyncTime, syncUserJobs } = useJobSyncStore();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time periodically to refresh the "time ago" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return "Never";

    const diffMs = currentTime - timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const getStatusText = () => {
    if (syncState.isSyncing) {
      return "Syncing";
    } else if (!syncState.isOnline) {
      return "Offline";
    } else {
      return "Online";
    }
  };

  const handleManualSync = async () => {
    if (!syncState.isSyncing && syncState.isOnline) {
      await syncUserJobs();
    }
  };

  return (
    <Button
      variant={syncState.isSyncing ? "outline" : "ghost"}
      size="sm"
      className="w-full justify-between px-2"
      onClick={handleManualSync}
      title={`${getStatusText()} - Last sync: ${formatLastSync(lastSyncTime)}. Click to sync now.`}
      disabled={!syncState.isOnline}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <Clock className="w-4 h-4 hidden lg:block " />
        <div className="text-xs">{syncState.isSyncing ? "Syncing..." : formatLastSync(lastSyncTime)}</div>
      </div>
      {!syncState.isSyncing && <RotateCcw className="h-4 w-4 shrink-0" />}
    </Button>
  );
}
