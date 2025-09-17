import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";
import { swStartJobSync, swStopJobSync } from "./job";
import { swStartQueueProcessing, swStopQueueProcessing } from "./queue";
import { swCheckOfflineMode } from "./offline";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const cacheVersion = "1.0.5"; // Increment this to force service worker updates

let backgroundProcessesRunning = false;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [
    // Use Serwist's default cache strategies for Next.js assets (this handles JS chunks, CSS, etc.)
    ...defaultCache,
    {
      // Cache navigation requests (pages) with a custom strategy
      matcher: ({ request }) => request.mode === "navigate",
      handler: async ({ request }) => {
        const cacheName = `pages-cache-${cacheVersion}`;
        const cache = await caches.open(cacheName);

        try {
          // First, try to get from cache
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            console.log(`Found cached page for: ${request.url}`);

            // If we're online, try to update the cache in the background
            if (navigator.onLine) {
              try {
                const networkResponse = await fetch(request);
                if (networkResponse.ok) {
                  await cache.put(request, networkResponse.clone());
                  console.log(`Updated cache for: ${request.url}`);
                  return networkResponse;
                }
              } catch {
                console.log(`Network failed for ${request.url}, serving cached version`);
              }
            }

            return cachedResponse;
          }

          // If no cache and we're online, try network
          if (navigator.onLine) {
            try {
              const networkResponse = await fetch(request);
              if (networkResponse.ok) {
                await cache.put(request, networkResponse.clone());
                console.log(`Cached new page: ${request.url}`);
                return networkResponse;
              }
            } catch {
              console.log(`Network failed for ${request.url}`);
            }
          }

          // If all else fails, redirect to offline page
          console.log(`No cache available for ${request.url}, redirecting to offline page`);
          return Response.redirect("/offline", 302);
        } catch (error) {
          console.error(`Error handling navigation request for ${request.url}:`, error);
          return Response.redirect("/offline", 302);
        }
      },
    },
    {
      // Cache critical API endpoints (owners, suppliers) with custom strategy
      matcher: ({ url }) => {
        const pathname = url.pathname;
        return pathname === "/api/owners" || pathname === "/api/suppliers" || pathname === "/api/task-stages";
      },
      handler: async ({ request }) => {
        const cacheName = `common-api-data-${cacheVersion}`;
        const cache = await caches.open(cacheName);

        try {
          // First, try to get from cache
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            console.log(`Found cached API data for: ${request.url}`);

            // If we're online, try to update the cache in the background
            if (navigator.onLine) {
              try {
                const networkResponse = await fetch(request);
                if (networkResponse.ok) {
                  await cache.put(request, networkResponse.clone());
                  console.log(`Updated API cache for: ${request.url}`);
                  return networkResponse;
                }
              } catch {
                console.log(`Network failed for API ${request.url}, serving cached version`);
              }
            }

            return cachedResponse;
          }

          // If no cache and we're online, try network
          if (navigator.onLine) {
            try {
              const networkResponse = await fetch(request);
              if (networkResponse.ok) {
                await cache.put(request, networkResponse.clone());
                console.log(`Cached new API data: ${request.url}`);
                return networkResponse;
              }
            } catch {
              console.log(`Network failed for API ${request.url}`);
            }
          }

          // If all else fails, return empty array for critical endpoints
          console.log(`No cache available for API ${request.url}, returning empty array`);
          return Response.json([], { status: 200 });
        } catch (error) {
          console.error(`Error handling API request for ${request.url}:`, error);
          return Response.json([], { status: 200 });
        }
      },
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

// Install event - prepare the service worker and force update
self.addEventListener("install", (event: ExtendableEvent) => {
  console.log("Service worker installing...");
  serwist.handleInstall(event);
});

// Activate event - start background processes only if offline mode is enabled
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      self.clients.claim();
      serwist.handleActivate(event);

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
self.addEventListener("deactivate", () => {
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

serwist.addEventListeners();
