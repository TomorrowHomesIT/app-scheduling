import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, StaleWhileRevalidate } from "serwist";
import { defaultCache } from "@serwist/next/worker";
import { DB_NAME, DB_VERSION, STORE_NAME, type QueuedRequest } from "@/models/db.model";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
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

// Function to get queue from IndexedDB
const getQueue = (): Promise<QueuedRequest[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => {
        console.error("Failed to get queue from IndexedDB:", getAllRequest.error);
        reject(getAllRequest.error);
      };
    };

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error);
      reject(request.error);
    };
  });
};

// Function to remove request from IndexedDB queue
const removeFromQueue = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        console.log(`Removed request ${id} from queue`);
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error("Failed to remove request from queue:", deleteRequest.error);
        reject(deleteRequest.error);
      };
    };

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error);
      reject(request.error);
    };
  });
};

// Function to update retry count in IndexedDB
const updateRetryCount = (id: string, attempts: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // First get the current request
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const queuedRequest = getRequest.result;
        if (queuedRequest) {
          queuedRequest.attempts = attempts;
          const putRequest = store.put(queuedRequest);

          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error("Request not found"));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error);
      reject(request.error);
    };
  });
};

// Function to determine if a request should be retried
const shouldRetryRequest = (): boolean => {
  // Only retry if we're online
  // If we're offline, keep the request in queue without burning retry attempts
  return navigator.onLine;
};

// Function to process queued request
const processRequest = async (queuedRequest: QueuedRequest): Promise<boolean> => {
  try {
    const options: RequestInit = {
      method: queuedRequest.method,
      headers: queuedRequest.headers,
    };

    if (queuedRequest.body && queuedRequest.method !== "GET") {
      options.body = typeof queuedRequest.body === "string" ? queuedRequest.body : JSON.stringify(queuedRequest.body);
    }

    const response = await fetch(queuedRequest.url, options);

    if (response.ok) {
      console.log(`Successfully processed queued request: ${queuedRequest.method} ${queuedRequest.url}`);
      return true;
    } else {
      console.warn(`Failed to process request ${queuedRequest.method} ${queuedRequest.url}: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing request ${queuedRequest.method} ${queuedRequest.url}:`, error);
    return false;
  }
};

// Background sync for queued updates
self.addEventListener("sync", (event: Event) => {
  const syncEvent = event as any; // SyncEvent is not available in all environments
  if (syncEvent.tag === "background-sync-queue") {
    syncEvent.waitUntil(processQueue());
  }
});

// Process the request queue
async function processQueue(): Promise<void> {
  try {
    console.log("Starting background sync for queued requests...");

    // Only process queue if we're actually online
    if (!navigator.onLine) {
      console.log("Offline - skipping queue processing");
      return;
    }

    const queue = await getQueue();
    if (queue.length === 0) {
      console.log("No queued requests to process");
      return;
    }

    console.log(`Processing ${queue.length} queued requests...`);

    for (const request of queue) {
      try {
        const success = await processRequest(request);

        if (success) {
          await removeFromQueue(request.id);
        } else {
          // Only retry for server errors (4xx, 5xx), not network errors
          // Network errors mean we're offline, so don't burn retry attempts
          const shouldRetry = shouldRetryRequest();

          if (shouldRetry) {
            request.attempts++;

            if (request.attempts >= request.maxAttempts) {
              console.warn(`Max retries reached for request ${request.id}, removing from queue`);
              await removeFromQueue(request.id);
            } else {
              console.log(`Request ${request.id} failed, will retry (${request.attempts}/${request.maxAttempts})`);
              await updateRetryCount(request.id, request.attempts);
            }
          } else {
            console.log(`Request ${request.id} failed due to network error - keeping in queue for when online`);
            // Don't increment retry count for network errors
          }
        }
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);

        // Check if this is a network error (offline) or actual error
        const shouldRetry = shouldRetryRequest();

        if (shouldRetry) {
          request.attempts++;

          if (request.attempts >= request.maxAttempts) {
            await removeFromQueue(request.id);
          } else {
            await updateRetryCount(request.id, request.attempts);
          }
        } else {
          console.log(`Request ${request.id} failed due to network error - keeping in queue for when online`);
          // Don't increment retry count for network errors
        }
      }
    }

    console.log("Background sync completed");
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Register background sync when online
self.addEventListener("online", () => {
  console.log("Service worker detected online status");

  // Register background sync
  if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
    (self as any).registration.sync.register("background-sync-queue").catch((error: Error) => {
      console.error("Failed to register background sync:", error);
    });
  }
});

// Listen for messages from the app
self.addEventListener("message", (event: Event) => {
  const messageEvent = event as any; // MessageEvent is not available in all environments
  const { type } = messageEvent.data;

  if (type === "process-queue") {
    processQueue();
  }
});

// Set up periodic queue processing (every 10 seconds)
let queueProcessingInterval: NodeJS.Timeout | null = null;

const startQueueProcessing = () => {
  if (queueProcessingInterval) {
    clearInterval(queueProcessingInterval);
  }

  queueProcessingInterval = setInterval(() => {
    processQueue();
  }, 10000); // 10 seconds

  console.log("Started periodic queue processing (every 10 seconds)");
};

const stopQueueProcessing = () => {
  if (queueProcessingInterval) {
    clearInterval(queueProcessingInterval);
    queueProcessingInterval = null;
    console.log("Stopped periodic queue processing");
  }
};

// Start queue processing when service worker is activated
self.addEventListener("activate", () => {
  startQueueProcessing();
});

// Stop queue processing when service worker is deactivated
self.addEventListener("deactivate", () => {
  stopQueueProcessing();
});
