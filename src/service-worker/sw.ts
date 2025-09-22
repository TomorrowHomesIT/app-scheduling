import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { swStartJobSync, swStopJobSync } from "./job";
import { swAddRequestToQueue, swStartQueueProcessing, swStopQueueProcessing } from "./queue";

declare const self: ServiceWorkerGlobalScope;

const cacheVersion = "1.0.6";

// Clean up old caches
cleanupOutdatedCaches();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Helper function to check if error is retryable
const isRetryableError = (status: number): boolean => {
  return status === 0 || status === 408 || status === 429 || status === 401 || status >= 500;
};

// Cache-first fetch handler for Supabase requests
self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Only handle Supabase requests
  if (!url.hostname.includes("supabase")) {
    return;
  }

  // Don't cache auth requests
  if (url.pathname.includes("/auth/")) {
    return;
  }

  event.respondWith(
    (async () => {
      const cacheName = `supabase-cache-${cacheVersion}`;
      const cache = await caches.open(cacheName);

      try {
        // For GET requests, try cache first
        if (event.request.method === "GET") {
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            console.log(`Cache hit: ${event.request.url}`);

            // Update cache in background if online
            if (navigator.onLine) {
              fetch(event.request.clone())
                .then((response) => {
                  if (response.ok) {
                    cache.put(event.request, response.clone());
                  }
                })
                .catch(() => {
                  // Silently fail background update
                });
            }

            return cachedResponse;
          }
        }

        // Try network first
        const networkResponse = await fetch(event.request.clone());

        if (networkResponse.ok) {
          // Cache successful GET responses
          if (event.request.method === "GET") {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } else {
          // Check if this is a retryable error for non-GET requests
          if (event.request.method !== "GET" && isRetryableError(networkResponse.status)) {
            console.log(
              `Request failed with retryable error ${networkResponse.status}, queuing: ${event.request.method} ${event.request.url}`,
            );
            await swAddRequestToQueue(event.request);
          }
          return networkResponse;
        }
      } catch (error) {
        console.log(`Network error for ${event.request.method} ${event.request.url}, queuing if applicable`);

        // For GET requests, try to serve from cache
        if (event.request.method === "GET") {
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            console.log(`Serving cached response for failed request: ${event.request.url}`);
            return cachedResponse;
          }
        } else {
          // Queue non-GET requests that failed due to network errors
          await swAddRequestToQueue(event.request);
        }

        // Re-throw error if no cache available
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

// Activate event - always start background processes
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      // Always start background processes
      swStartQueueProcessing();
      swStartJobSync();
      console.log("Service worker activated - background processes started");
    })(),
  );
});

// Handle service worker termination (cleanup)
self.addEventListener("beforeunload", () => {
  console.log("Service worker terminating, stopping background processes...");
  swStopQueueProcessing();
  swStopJobSync();
});

// Listen for messages from the app (reserved for future use)
self.addEventListener("message", async (event: ExtendableMessageEvent) => {
  console.log("Service worker received message:", event.data);
});
