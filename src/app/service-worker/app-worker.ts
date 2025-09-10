import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, StaleWhileRevalidate } from "serwist";
import { defaultCache } from "@serwist/next/worker";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & SerwistGlobalConfig;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Use Serwist's default cache strategies for Next.js assets
    ...defaultCache,
    {
      // Override navigation handling for offline support
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              if (response && response.status === 200) {
                return response;
              }
              return null;
            },
            handlerDidError: async () => {
              // Return offline page when both network and cache fail
              return caches.match("/offline") || new Response("Offline", { status: 503 });
            },
          },
        ],
      }),
    },
    {
      // Cache critical API endpoints (owners, suppliers) with StaleWhileRevalidate
      // These rarely change and are needed for navigation
      matcher: ({ url }) => {
        const pathname = url.pathname;
        return pathname === "/api/owners" || pathname === "/api/suppliers" || pathname === "/api/task-stages";
      },
      handler: new StaleWhileRevalidate({
        cacheName: "common-api-data",
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              if (response && response.status === 200) {
                return response;
              }
              return null;
            },
            handlerDidError: async () => {
              // Return empty array as fallback for list endpoints
              return Response.json([], { status: 200 });
            },
          },
        ],
      }),
    },
    {
      // Cache other API responses with NetworkFirst
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              if (response && response.status === 200) {
                return response;
              }
              return null;
            },
            handlerDidError: async () => Response.json({ error: "Offline" }, { status: 503 }),
          },
        ],
      }),
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

serwist.addEventListeners();
