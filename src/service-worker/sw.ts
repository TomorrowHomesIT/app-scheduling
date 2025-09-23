import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { swAddRequestToQueue } from "./queue";

declare const self: ServiceWorkerGlobalScope;

const cacheVersion = "1.0.6";

// Import shared auth state
import { getAuthToken, setAuthToken, isAuthenticated } from "./auth-state";
import { setApiBaseUrl } from "./sw-api";

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
              // Add auth header for background update if we have a token
              const authToken = getAuthToken();
              const updateRequest = authToken && !event.request.headers.has('Authorization') ? 
                new Request(event.request, { 
                  headers: { 
                    ...Object.fromEntries(event.request.headers),
                    'Authorization': `Bearer ${authToken}` 
                  }
                }) : event.request.clone();
                
              fetch(updateRequest)
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

        // Try network first - add auth if not present and we have token
        const authToken = getAuthToken();
        const requestWithAuth = authToken && !event.request.headers.has('Authorization') ? 
          new Request(event.request, { 
            headers: { 
              ...Object.fromEntries(event.request.headers),
              'Authorization': `Bearer ${authToken}` 
            }
          }) : event.request.clone();
        
        const networkResponse = await fetch(requestWithAuth);

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

// Activate event
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      console.log("Service worker activated");
    })(),
  );
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
    setApiBaseUrl(event.data.url);
    console.log("Service worker: API base URL updated to", event.data.url);
  } else if (event.data.type === "REQUEST_AUTH_TOKEN") {
    // Request token from main thread if we don't have one
    if (!isAuthenticated()) {
      event.ports[0]?.postMessage({ type: "AUTH_TOKEN_NEEDED" });
    }
  }
});
