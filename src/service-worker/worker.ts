import { swStartJobSync, swStopJobSync } from "./job";
import { swStartQueueProcessing, swStopQueueProcessing } from "./queue";
import { swCheckOfflineMode } from "./offline";

declare const self: ServiceWorkerGlobalScope;

let backgroundProcessesRunning = false;

// Install event
self.addEventListener("install", (event: ExtendableEvent) => {
  console.log("Service worker installing...");
  self.skipWaiting();
});

// Activate event - start background processes only if offline mode is enabled
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      // Check if offline mode is enabled before starting background processes
      const offlineModeEnabled = await swCheckOfflineMode();

      if (offlineModeEnabled) {
        swStartQueueProcessing();
        swStartJobSync();
        backgroundProcessesRunning = true;
        console.log("Service worker activated with offline mode - background processes started");
      } else {
        console.log("Service worker activated without offline mode - background processes not started");
        backgroundProcessesRunning = false;
      }
    })(),
  );
});

// Handle service worker termination (cleanup)
self.addEventListener("beforeunload", () => {
  console.log("Service worker terminating, stopping background processes...");
  swStopQueueProcessing();
  swStopJobSync();
  backgroundProcessesRunning = false;
});

// Listen for messages from the app
self.addEventListener("message", async (event: ExtendableMessageEvent) => {
  if (event.data?.type === "OFFLINE_MODE_CHANGED") {
    const enabled = event.data.offlineMode;
    console.log(`Received offline mode change: ${enabled ? "enabled" : "disabled"}`);

    if (enabled && !backgroundProcessesRunning) {
      // Start background processes
      swStartQueueProcessing();
      swStartJobSync();
      backgroundProcessesRunning = true;
      console.log("Started background processes due to offline mode being enabled");
    } else if (!enabled && backgroundProcessesRunning) {
      // Stop background processes
      swStopQueueProcessing();
      swStopJobSync();
      backgroundProcessesRunning = false;
      console.log("Stopped background processes due to offline mode being disabled");
    }
  }
});
