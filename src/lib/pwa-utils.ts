"use client";

/**
 * PWA utility functions for managing offline capabilities
 */

/**
 * Triggers the service worker to preload all user jobs and cache their routes
 */
export const preloadJobsForOffline = async (): Promise<void> => {
  try {
    console.log("PWA: Attempting to preload jobs for offline...");

    if ("serviceWorker" in navigator) {
      console.log("PWA: ServiceWorker supported, waiting for registration...");
      const registration = await navigator.serviceWorker.ready;
      console.log("PWA: ServiceWorker registration ready:", registration);

      if (registration.active) {
        console.log("PWA: ServiceWorker is active, sending sync-jobs message...");
        // Send message to service worker to trigger job sync
        registration.active.postMessage({
          type: "sync-jobs",
        });

        console.log("PWA: Requested job sync from service worker");
      } else {
        console.warn("PWA: Service worker not active, cannot preload jobs");
      }
    } else {
      console.warn("PWA: Service worker not supported, cannot preload jobs");
    }
  } catch (error) {
    console.error("PWA: Failed to preload jobs:", error);
  }
};
