"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

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

  if (isOnline && !showReconnected) {
    return null;
  }

  const offlineComponent = (
    <>
      <WifiOff className="w-4 h-4" />
      <span>You're offline - Changes will sync when reconnected</span>
    </>
  );

  const onlineComponent = (
    <>
      <Wifi className="w-4 h-4" />
      <span>Back online</span>
    </>
  );

  return (
    <div className={`transition-all duration-300 ${isOnline ? "bg-green-500" : "bg-orange-500"}`}>
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium">
        {isOnline ? onlineComponent : offlineComponent}
      </div>
    </div>
  );
}
