import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { swStartJobSync, swStopJobSync } from "./job";
import { swAddRequestToQueue, swStartQueueProcessing, swStopQueueProcessing } from "./queue";
import { swInitIndexedDB } from "./db";
import { QUEUE_STORE_NAME, type QueuedRequest } from "@/models/db.model";

declare const self: ServiceWorkerGlobalScope;

const cacheVersion = "1.0.5";

// Clean up old caches
cleanupOutdatedCaches();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

let backgroundProcessesRunning = false;

// Custom navigation handler with offline fallback
// const navigationHandler = async ({ request }: { request: Request }) => {
//   const cacheName = `pages-cache-${cacheVersion}`;
//   const cache = await caches.open(cacheName);

//   try {
//     // First, try to get from cache
//     const cachedResponse = await cache.match(request);
//     if (cachedResponse) {
//       console.log(`Found cached page for: ${request.url}`);

//       // If we're online, try to update the cache in the background
//       if (navigator.onLine) {
//         try {
//           const networkResponse = await fetch(request);
//           if (networkResponse.ok) {
//             await cache.put(request, networkResponse.clone());
//             console.log(`Updated cache for: ${request.url}`);
//             return networkResponse;
//           }
//         } catch {
//           console.log(`Network failed for ${request.url}, serving cached version`);
//         }
//       }

//       return cachedResponse;
//     }

//     // If no cache and we're online, try network
//     if (navigator.onLine) {
//       try {
//         const networkResponse = await fetch(request);
//         if (networkResponse.ok) {
//           await cache.put(request, networkResponse.clone());
//           console.log(`Cached new page: ${request.url}`);
//           return networkResponse;
//         }
//       } catch {
//         console.log(`Network failed for ${request.url}`);
//       }
//     }

//     // If all else fails, redirect to offline page
//     console.log(`No cache available for ${request.url}, redirecting to offline page`);
//     return Response.redirect("/offline", 302);
//   } catch (error) {
//     console.error(`Error handling navigation request for ${request.url}:`, error);
//     return Response.redirect("/offline", 302);
//   }
// };

// // Register navigation route
// const navigationRoute = new NavigationRoute(navigationHandler);
// registerRoute(navigationRoute);

// // Cache critical API endpoints
// registerRoute(
//   ({ url }) => {
//     const pathname = url.pathname;
//     return pathname === "/api/owners" || pathname === "/api/suppliers" || pathname === "/api/task-stages";
//   },
//   async ({ request }) => {
//     const cacheName = `common-api-data-${cacheVersion}`;
//     const cache = await caches.open(cacheName);

//     try {
//       // First, try to get from cache
//       const cachedResponse = await cache.match(request);
//       if (cachedResponse) {
//         console.log(`Found cached API data for: ${request.url}`);

//         // If we're online, try to update the cache in the background
//         if (navigator.onLine) {
//           try {
//             const networkResponse = await fetch(request);
//             if (networkResponse.ok) {
//               await cache.put(request, networkResponse.clone());
//               console.log(`Updated API cache for: ${request.url}`);
//               return networkResponse;
//             }
//           } catch {
//             console.log(`Network failed for API ${request.url}, serving cached version`);
//           }
//         }

//         return cachedResponse;
//       }

//       // If no cache and we're online, try network
//       if (navigator.onLine) {
//         try {
//           const networkResponse = await fetch(request);
//           if (networkResponse.ok) {
//             await cache.put(request, networkResponse.clone());
//             console.log(`Cached new API data: ${request.url}`);
//             return networkResponse;
//           }
//         } catch {
//           console.log(`Network failed for API ${request.url}`);
//         }
//       }

//       // If all else fails, return empty array for critical endpoints
//       console.log(`No cache available for API ${request.url}, returning empty array`);
//       return Response.json([], { status: 200 });
//     } catch (error) {
//       console.error(`Error handling API request for ${request.url}:`, error);
//       return Response.json([], { status: 200 });
//     }
//   }
// );

// Cache external resources like Google Fonts
// registerRoute(
//   /^https:\/\/fonts\.googleapis\.com\/.*/i,
//   new CacheFirst({
//     cacheName: "google-fonts-cache",
//   }),
// );

// Helper function to check if error is retryable
const isRetryableError = (status: number): boolean => {
  return status === 408 || status === 429 || status === 401 || status >= 500;
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
self.addEventListener("install", (event: ExtendableEvent) => {
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
      backgroundProcessesRunning = true;
      console.log("Service worker activated - background processes started");
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

// Listen for messages from the app (reserved for future use)
self.addEventListener("message", async (event: ExtendableMessageEvent) => {
  console.log("Service worker received message:", event.data);
});
