import { useState, useEffect } from "react";
import { offlineQueue } from "@/lib/offline-queue";

export function useOfflineQueue() {
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    // Get initial count
    const getInitialCount = async () => {
      try {
        const count = await offlineQueue.getQueueCount();
        setQueueCount(count);
      } catch (error) {
        console.error("Failed to get initial queue count", error);
        setQueueCount(0);
      }
    };

    getInitialCount();

    // polling every 5 seconds for sync changes
    const pollInterval = setInterval(async () => {
      try {
        const count = await offlineQueue.getQueueCount();
        setQueueCount(count);
      } catch (error) {
        console.error("Failed to poll queue count", error);
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  return {
    queueCount,
    hasQueuedItems: queueCount > 0,
  };
}
