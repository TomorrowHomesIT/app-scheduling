"use client";

import { useState, useEffect, useCallback } from "react";
import { offlineQueue } from "@/lib/offline-queue";

export function useOfflineQueue() {
  const [queueStatus, setQueueStatus] = useState(offlineQueue.getQueueStatus());

  // Update queue status
  const updateQueueStatus = useCallback(() => {
    setQueueStatus(offlineQueue.getQueueStatus());
  }, []);

  useEffect(() => {
    // Update status periodically
    const interval = setInterval(updateQueueStatus, 2000);

    // Update when coming back online
    const onlineHandler = () => {
      setTimeout(updateQueueStatus, 1000);
    };

    window.addEventListener("online", onlineHandler);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onlineHandler);
    };
  }, [updateQueueStatus]);

  // Queue a request with optimistic update support
  const queueRequest = useCallback(
    async (
      url: string,
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
      body?: unknown,
      headers?: Record<string, string>,
      maxAttempts = 10,
    ) => {
      const result = await offlineQueue.queueRequest(url, method, body, headers, maxAttempts);
      updateQueueStatus();
      return result;
    },
    [updateQueueStatus],
  );

  return {
    queueStatus,
    queueRequest,
    updateQueueStatus,
    hasQueuedItems: queueStatus.hasItems,
    queueCount: queueStatus.count,
  };
}
