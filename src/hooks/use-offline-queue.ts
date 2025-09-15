"use client";

import { useState, useEffect } from "react";
import { offlineQueue } from "@/lib/offline-queue";

export function useOfflineQueue() {
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    // Get initial count
    const getInitialCount = async () => {
      const count = await offlineQueue.getQueueCount();
      setQueueCount(count);
    };

    getInitialCount();

    // Poll for changes every 2 seconds
    const pollInterval = setInterval(async () => {
      const count = await offlineQueue.getQueueCount();
      setQueueCount(count);
    }, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  return {
    queueCount,
    hasQueuedItems: queueCount > 0,
  };
}
