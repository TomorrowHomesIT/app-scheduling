import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { swAddRequestToQueue, swProcessQueue, swStartQueueProcessing } from "./queue";
import { setAuthToken, isAuthenticated } from "./auth-state";

declare const self: ServiceWorkerGlobalScope;

// Clean up old caches
cleanupOutdatedCaches();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Helper function to check if error is retryable
const isRetryableError = (status: number): boolean => {
  return status === 0 || status === 408 || status === 429 || status === 401 || status >= 500;
};

// Fetch handler for API requests with automatic retry queueing
self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // We only include task updates and email at this time
  const isRetryableRequest = url.pathname.includes("/api/jobs/") && url.pathname.includes("/tasks/");
  if (!isRetryableRequest) {
    console.log(`SW not handling request: ${event.request.method} ${event.request.url}`);
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request.clone());
        if (networkResponse.ok) {
          return networkResponse;
        } else {
          // Queue failed requests that are retryable
          if (isRetryableError(networkResponse.status)) {
            console.log(
              `Request failed with retryable error ${networkResponse.status}, queuing: ${event.request.method} ${event.request.url}`,
            );
            await swAddRequestToQueue(event.request);
          }
          return networkResponse;
        }
      } catch (error) {
        console.log(`Network error for ${event.request.method} ${event.request.url}`);
        // Queue all failed requests (network errors)
        await swAddRequestToQueue(event.request);
        // Re-throw error
        throw error;
      }
    })(),
  );
});

// Install event
self.addEventListener("install", (_: ExtendableEvent) => {
  console.log("Service worker installing...");
  self.skipWaiting();
});

// Activate event - start background queue processing
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      // Start background queue processing
      swStartQueueProcessing();
      console.log("Service worker activated - background queue processing started");
    })(),
  );
});

// Background sync event - for browsers that support it
self.addEventListener("sync", (event: Event) => {
  const syncEvent = event as ExtendableEvent & { tag?: string };
  console.log("Background sync event triggered:", syncEvent.tag);

  if (syncEvent.tag === "queue-processing") {
    syncEvent.waitUntil(swProcessQueue());
  }
});

// Listen for messages from the app
self.addEventListener("message", async (event: ExtendableMessageEvent) => {
  console.log("Service worker received message:", event.data);

  if (event.data.type === "AUTH_TOKEN_UPDATE") {
    const wasUnauthenticated = !isAuthenticated();
    setAuthToken(event.data.token);
    console.log("Service worker: Auth token updated");

    // Re-register queue processing if we were previously unauthenticated
    if (wasUnauthenticated) {
      // Queue processing will be handled automatically when requests are queued
      console.log("Service worker: Auth token restored");
    }
  } else if (event.data.type === "AUTH_TOKEN_CLEAR") {
    setAuthToken(null);
    console.log("Service worker: Auth token cleared - background processes will idle");
  } else if (event.data.type === "API_URL_UPDATE") {
    // TODO probably not needed with request clone and the que
    console.log("Service worker: API base URL updated to", event.data.url);
  } else if (event.data.type === "VISIBILITY_CHANGE" && event.data.visible) {
    console.log("App became visible - processing queue");
    await swProcessQueue();
  } else if (event.data.type === "ONLINE_CHANGE" && event.data.online) {
    console.log("App came online - processing queue");
    await swProcessQueue();
  }
});
