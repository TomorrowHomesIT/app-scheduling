import { useState, useEffect } from "react";
import { WifiOff, Wifi, Clock } from "lucide-react";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const { hasQueuedItems, queueCount } = useOfflineQueue();

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;

      if (!isOnline && online) {
        // Coming back online
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }

      setIsOnline(online);
    };

    // Check initial status
    updateOnlineStatus();

    // Add event listeners
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [isOnline]);

  // Show if offline, reconnected, or has queued items
  if (isOnline && !showReconnected && !hasQueuedItems) {
    return null;
  }

  const getContent = () => {
    if (!isOnline) {
      return (
        <>
          <WifiOff className="w-4 h-4" />
          <span>OFFLINE - Changes will sync when reconnected</span>
          {hasQueuedItems && <span className="ml-2 bg-white/20 rounded px-2 py-0.5 text-xs">{queueCount} pending</span>}
        </>
      );
    }

    if (showReconnected) {
      return (
        <>
          <Wifi className="w-4 h-4" />
          <span>Back online</span>
          {hasQueuedItems && <span className="text-xs ml-2">Syncing changes...</span>}
        </>
      );
    }

    if (hasQueuedItems) {
      return (
        <>
          <Clock className="w-4 h-4" />
          <span>
            Syncing {queueCount} change{queueCount !== 1 ? "s" : ""}...
          </span>
        </>
      );
    }

    return null;
  };

  const getBgColor = () => {
    if (!isOnline) return "bg-orange-500";
    if (showReconnected) return "bg-green-500";
    if (hasQueuedItems) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <div className={`transition-all duration-300 ${getBgColor()}`}>
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium">
        {getContent()}
      </div>
    </div>
  );
}
