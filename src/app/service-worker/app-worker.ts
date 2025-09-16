import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";
import {
  DB_NAME,
  DB_VERSION,
  QUEUE_STORE_NAME,
  JOBS_STORE_NAME,
  TASKS_STORE_NAME,
  type QueuedRequest,
  type StoredJob,
  type StoredTask,
} from "@/models/db.model";

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

const cacheVersion = "1.0.2";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false, // Disable navigation preload to ensure proper cache fallback
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

serwist.addEventListeners();

// Add global error handling to prevent service worker crashes
self.addEventListener("error", (event: Event) => {
  const errorEvent = event as ErrorEvent;
  console.error("Service Worker Error:", errorEvent.error);
  // Don't prevent default - let the error be handled normally
});

self.addEventListener("unhandledrejection", (event: Event) => {
  const rejectionEvent = event as PromiseRejectionEvent;
  console.error("Service Worker Unhandled Promise Rejection:", rejectionEvent.reason);
  // Prevent the default behavior which would crash the service worker
  rejectionEvent.preventDefault();
});

// Initialize IndexedDB with all stores
const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Service Worker: Failed to open IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log("Service Worker: IndexedDB opened successfully");
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log("Service Worker: IndexedDB upgrade needed, creating stores...");
      const db = (event.target as IDBOpenDBRequest).result;

      // Create queue store if it doesn't exist
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        console.log("Service Worker: Creating queue store:", QUEUE_STORE_NAME);
        const store = db.createObjectStore(QUEUE_STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Create jobs store if it doesn't exist
      if (!db.objectStoreNames.contains(JOBS_STORE_NAME)) {
        console.log("Service Worker: Creating jobs store:", JOBS_STORE_NAME);
        const jobsStore = db.createObjectStore(JOBS_STORE_NAME, { keyPath: "id" });
        jobsStore.createIndex("lastUpdated", "lastUpdated", { unique: false });
        jobsStore.createIndex("lastSynced", "lastSynced", { unique: false });
      }

      // Create tasks store if it doesn't exist
      if (!db.objectStoreNames.contains(TASKS_STORE_NAME)) {
        console.log("Service Worker: Creating tasks store:", TASKS_STORE_NAME);
        const tasksStore = db.createObjectStore(TASKS_STORE_NAME, { keyPath: "id" });
        tasksStore.createIndex("jobId", "jobId", { unique: false });
        tasksStore.createIndex("lastUpdated", "lastUpdated", { unique: false });
        tasksStore.createIndex("lastSynced", "lastSynced", { unique: false });
      }
    };
  });
};

// Function to get queue from IndexedDB
const getQueue = async (): Promise<QueuedRequest[]> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], "readonly");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => {
        console.error("Failed to get queue from IndexedDB:", getAllRequest.error);
        reject(getAllRequest.error);
      };
    });
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    return [];
  }
};

// Function to remove request from IndexedDB queue
const removeFromQueue = async (id: string): Promise<void> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], "readwrite");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        console.log(`Removed request ${id} from queue`);
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error("Failed to remove request from queue:", deleteRequest.error);
        reject(deleteRequest.error);
      };
    });
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    throw error;
  }
};

// Function to update retry count in IndexedDB
const updateRetryCount = async (id: string, attempts: number): Promise<void> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], "readwrite");
      const store = transaction.objectStore(QUEUE_STORE_NAME);

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
    });
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    throw error;
  }
};

// Function to determine if a request should be retried
const shouldRetryRequest = (): boolean => {
  // Only retry if we're online
  // If we're offline, keep the request in queue without burning retry attempts
  return navigator.onLine;
};

// Function to determine if an HTTP status code is retryable
const isRetryableError = (status: number): boolean => {
  // Retryable errors are typically:
  // - 5xx server errors (500, 502, 503, 504, etc.)
  // - 408 Request Timeout
  // - 429 Too Many Requests
  // - Network errors (handled separately)

  // Non-retryable errors:
  // - 4xx client errors (400, 403, 404, etc.) - these won't succeed on retry
  // - 3xx redirects - these are handled by the browser

  if (status >= 500) {
    return true; // All 5xx server errors are retryable
  }

  if (status === 408 || status === 429 || status === 401) {
    return true; // Timeout and rate limiting are retryable
  }

  return false; // All other errors (4xx, 3xx) are not retryable
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
      // Check if this is a retryable error
      if (isRetryableError(response.status)) {
        console.warn(
          `Failed to process request ${queuedRequest.method} ${queuedRequest.url} with retryable error: ${response.status}`,
        );
        return false; // Will be retried
      } else {
        console.warn(
          `Failed to process request ${queuedRequest.method} ${queuedRequest.url} with non-retryable error: ${response.status} - removing from queue`,
        );
        return true; // Mark as "successful" to remove from queue (but it actually failed)
      }
    }
  } catch (error) {
    console.error(`Error processing request ${queuedRequest.method} ${queuedRequest.url}:`, error);
    return false; // Network errors are retryable
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

// Set up periodic queue processing (every 10 seconds)
let queueProcessingInterval: NodeJS.Timeout | null = null;
const QUEUE_PROCESSING_INTERVAL = 10000;

// Set up periodic job sync (every 15 minutes)
let jobSyncInterval: NodeJS.Timeout | null = null;
const JOB_SYNC_INTERVAL = 15 * 60 * 1000;

const startQueueProcessing = () => {
  if (queueProcessingInterval) {
    clearInterval(queueProcessingInterval);
  }

  queueProcessingInterval = setInterval(() => {
    processQueue();
  }, QUEUE_PROCESSING_INTERVAL);

  console.log("Started periodic queue processing (every 10 seconds)");
};

const stopQueueProcessing = () => {
  if (queueProcessingInterval) {
    clearInterval(queueProcessingInterval);
    queueProcessingInterval = null;
    console.log("Stopped periodic queue processing");
  }
};

// Function to check if there are pending updates
const hasPendingUpdates = async (): Promise<boolean> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([JOBS_STORE_NAME, TASKS_STORE_NAME], "readonly");
      const jobsStore = transaction.objectStore(JOBS_STORE_NAME);
      const tasksStore = transaction.objectStore(TASKS_STORE_NAME);

      let pendingJobs = 0;
      let pendingTasks = 0;
      let completed = 0;

      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve(pendingJobs > 0 || pendingTasks > 0);
        }
      };

      // Check jobs
      const jobsRequest = jobsStore.getAll();
      jobsRequest.onsuccess = () => {
        const jobs = (jobsRequest.result as StoredJob[]) || [];
        pendingJobs = jobs.filter((job) => job.lastUpdated > job.lastSynced).length;
        checkComplete();
      };
      jobsRequest.onerror = () => reject(jobsRequest.error);

      // Check tasks
      const tasksRequest = tasksStore.getAll();
      tasksRequest.onsuccess = () => {
        const tasks = (tasksRequest.result as StoredTask[]) || [];
        pendingTasks = tasks.filter((task) => task.lastUpdated > task.lastSynced).length;
        checkComplete();
      };
      tasksRequest.onerror = () => reject(tasksRequest.error);
    });
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    return false;
  }
};

// Function to sync jobs from API
const syncJobs = async (): Promise<void> => {
  try {
    console.log("Starting job sync...");

    // Check if there are pending updates
    const hasPending = await hasPendingUpdates();
    if (hasPending) {
      console.log("Skipping job sync - there are pending updates");
      return;
    }

    // Only sync if online
    if (!navigator.onLine) {
      console.log("Skipping job sync - offline");
      return;
    }

    // Fetch user jobs from API
    const response = await fetch("/api/user/jobs");
    if (!response.ok) {
      console.warn("Failed to fetch jobs from API:", response.status);
      return;
    }

    const jobs = await response.json();
    if (!jobs || !Array.isArray(jobs)) {
      console.warn("Invalid jobs data received");
      return;
    }

    // Save jobs to IndexedDB
    const db = await initIndexedDB();
    const transaction = db.transaction([JOBS_STORE_NAME], "readwrite");
    const store = transaction.objectStore(JOBS_STORE_NAME);

    let completed = 0;
    const totalJobs = jobs.length;

    if (totalJobs === 0) {
      console.log("No jobs to sync");
      return;
    }

    jobs.forEach((job: any) => {
      const storedJob: StoredJob = {
        id: job.id,
        data: job,
        lastUpdated: Date.now(),
        lastSynced: Date.now(),
      };

      const putRequest = store.put(storedJob);
      putRequest.onsuccess = () => {
        completed++;
        if (completed === totalJobs) {
          console.log(`Successfully synced ${totalJobs} jobs`);
        }
      };
      putRequest.onerror = () => {
        console.error("Failed to save job to IndexedDB:", putRequest.error);
        completed++;
      };
    });
  } catch (error) {
    console.error("Job sync failed:", error);
  }
};

const startJobSync = () => {
  if (jobSyncInterval) {
    clearInterval(jobSyncInterval);
  }

  const interval = JOB_SYNC_INTERVAL;
  jobSyncInterval = setInterval(() => {
    syncJobs();
  }, interval); // 15 minutes

  console.log("Started periodic job sync (every 15 minutes)");
};

const stopJobSync = () => {
  if (jobSyncInterval) {
    clearInterval(jobSyncInterval);
    jobSyncInterval = null;
    console.log("Stopped periodic job sync");
  }
};

// Start queue processing and job sync when service worker is activated
self.addEventListener("activate", () => {
  startQueueProcessing();
  startJobSync();
});

// Stop queue processing and job sync when service worker is deactivated
self.addEventListener("deactivate", () => {
  stopQueueProcessing();
  stopJobSync();
});
