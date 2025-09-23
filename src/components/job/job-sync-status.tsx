import { Clock, Cloud, CloudOff, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import useJobStore from "@/store/job/job-store";
import useJobSyncStore from "@/store/job/job-sync-store";

export function JobSyncStatus() {
  const { currentJobSyncStatus } = useJobStore();
  const { syncState } = useJobSyncStore();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every minute to refresh the "time ago" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000); // Check for changes every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!currentJobSyncStatus) {
    return;
  }

  // Use current time for calculations if no sync status available
  const lastUpdated = currentJobSyncStatus.lastUpdated;
  const hasPendingUpdates = currentJobSyncStatus.hasPendingUpdates;

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

  const getStatusIcon = () => {
    if (syncState.isSyncing) {
      return <RotateCw className="h-4 w-4 animate-spin" />;
    } else if (hasPendingUpdates) {
      return <CloudOff className="h-4 w-4" />;
    }
    return <Cloud className="h-4 w-4" />;
  };

  const getStatusVariant = () => {
    if (syncState.isSyncing) {
      return "default" as const;
    } else if (hasPendingUpdates) {
      return "destructive" as const;
    }
    return "secondary" as const;
  };

  const getStatusText = () => {
    if (syncState.isSyncing) {
      return "Syncing";
    } else if (hasPendingUpdates) {
      return "Pending sync";
    }
    return "Synced";
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Badge variant={getStatusVariant()} className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
      </Badge>
      <div className="text-xs text-muted-foreground hidden lg:flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>Updated {formatTime(lastUpdated)}</span>
      </div>
    </div>
  );
}
