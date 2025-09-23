import { QUEUE_STORE_NAME, type QueuedRequest } from "@/models/db.model";
import { swInitIndexedDB } from "./db";
import { getAuthToken, isAuthenticated } from "./auth-state";

declare const self: ServiceWorkerGlobalScope;

const QUEUE_SYNC_TAG = "queue-processing";
let queueProcessingInterval: NodeJS.Timeout | null = null;
const QUEUE_PROCESSING_INTERVAL = 10000; // 10 seconds

// Function to process queued request
const processRequest = async (queuedRequest: QueuedRequest): Promise<boolean> => {
  try {
    // Use the original headers from the queued request
    const headers = { ...queuedRequest.headers };

    // Always use fresh auth token from service worker (replace any existing Authorization header)
    // This ensures we have the most current token incase it refreshed
    const authToken = getAuthToken();
    if (authToken) {
      if (headers.authorization) {
        headers.authorization = `Bearer ${authToken}`;
      } else {
        headers.Authorization = `Bearer ${authToken}`;
      }
    }

    const options: RequestInit = {
      method: queuedRequest.method,
      headers,
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

// Function to get queue from IndexedDB
const getQueue = async (): Promise<QueuedRequest[]> => {
  try {
    const db = await swInitIndexedDB();
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
    const db = await swInitIndexedDB();
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
    const db = await swInitIndexedDB();
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
  if (status === 408 || status === 429 || status === 401) {
    return true;
  }

  return false;
};

export const swStartQueueProcessing = () => {
  if (queueProcessingInterval) {
    clearInterval(queueProcessingInterval);
  }

  queueProcessingInterval = setInterval(() => {
    swProcessQueue();
  }, QUEUE_PROCESSING_INTERVAL);

  console.log("Started periodic queue processing (every 10 seconds)");
};

export const swStopQueueProcessing = () => {
  if (queueProcessingInterval) {
    clearInterval(queueProcessingInterval);
    queueProcessingInterval = null;
    console.log("Stopped periodic queue processing");
  }
};

// Process the request queue
export async function swProcessQueue(): Promise<void> {
  try {
    // Short-circuit if not authenticated
    if (!isAuthenticated()) {
      console.log("Skipping queue processing - no auth token");
      return;
    }

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

// Helper function to add request to queue
export const swAddRequestToQueue = async (request: Request): Promise<void> => {
  try {
    const db = await swInitIndexedDB();
    const queuedRequest: QueuedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      url: request.url,
      method: request.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
      body: request.method !== "GET" ? await request.clone().text() : undefined,
      headers: Object.fromEntries(request.headers),
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 10,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUEUE_STORE_NAME], "readwrite");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const addRequest = store.add(queuedRequest);

      addRequest.onsuccess = async () => {
        console.log(`Added request ${queuedRequest.id} to queue: ${request.method} ${request.url}`);

        // Trigger background sync immediately after adding to queue
        try {
          // In service worker context, use self.registration
          if (self.registration && "sync" in self.registration) {
            const syncManager = self.registration.sync as { register: (tag: string) => Promise<void> };
            await syncManager.register(QUEUE_SYNC_TAG);
            console.log("Background sync registered for queue processing");
          }
        } catch (error) {
          console.warn("Failed to trigger background sync:", error);
        }

        resolve();
      };

      addRequest.onerror = () => {
        console.error("Failed to add request to queue:", addRequest.error);
        reject(addRequest.error);
      };
    });
  } catch (error) {
    console.error("Failed to queue request:", error);
    throw error;
  }
};
