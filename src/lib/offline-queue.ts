import { DB_NAME, DB_VERSION, JOBS_STORE_NAME, QUEUE_STORE_NAME, type QueuedRequest } from "@/models/db.model";
import logger from "./logger";

class OfflineQueue {
  private db: IDBDatabase | null = null;

  constructor() {
    // Only initialize if we're in the browser
    if (typeof window !== "undefined") {
      this.initDB();
    }
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error("Failed to open IndexedDB", { error: JSON.stringify(request.error) });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log("IndexedDB upgrade needed, creating stores...");
        const db = (event.target as IDBOpenDBRequest).result;

        // Create queue store if it doesn't exist
        if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
          console.log("Creating queue store:", QUEUE_STORE_NAME);
          const store = db.createObjectStore(QUEUE_STORE_NAME, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }

        // Create jobs store if it doesn't exist
        if (!db.objectStoreNames.contains(JOBS_STORE_NAME)) {
          console.log("Creating jobs store:", JOBS_STORE_NAME);
          const jobsStore = db.createObjectStore(JOBS_STORE_NAME, { keyPath: "id" });
          jobsStore.createIndex("lastSynced", "lastSynced", { unique: false });
        }
      };
    });
  }

  private async ensureDBInitialized(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  private async getQueue(): Promise<QueuedRequest[]> {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([QUEUE_STORE_NAME], "readonly");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => {
        logger.error("Failed to get queue from IndexedDB", { error: JSON.stringify(getAllRequest.error) });
        reject(getAllRequest.error);
      };
    });
  }

  // Get queue count for UI display
  async getQueueCount(): Promise<number> {
    try {
      await this.ensureDBInitialized();
      const queue = await this.getQueue();
      return queue.length;
    } catch (error) {
      logger.error("Failed to get queue count from DB", { error: JSON.stringify(error) });
      return 0;
    }
  }

  // Get queued requests for a specific job
  async getQueuedRequestsForJob(jobId: number): Promise<QueuedRequest[]> {
    try {
      await this.ensureDBInitialized();
      const queue = await this.getQueue();
      // Filter for requests related to this job (checking URL for job ID)
      // This includes task updates and email sends sinc they are all at /tasks/id
      return queue.filter((req) => {
        const jobTaskPattern = new RegExp(`/jobs/${jobId}/tasks`);
        return jobTaskPattern.test(req.url);
      });
    } catch (error) {
      logger.error("Failed to getQueuedRequestsForJob", { jobId, error: JSON.stringify(error) });
      return [];
    }
  }

  // Check if a job has pending requests in queue
  async jobHasPendingRequests(jobId: number): Promise<boolean> {
    const jobRequests = await this.getQueuedRequestsForJob(jobId);
    return jobRequests.length > 0;
  }

  // Remove a specific request from the queue
  async removeFromQueue(id: string): Promise<void> {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([QUEUE_STORE_NAME], "readwrite");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        console.log(`Removed request ${id} from queue`);
        resolve();
      };

      deleteRequest.onerror = () => {
        logger.error("Failed to removeFromQueue", {
          queueId: id,
          error: JSON.stringify(deleteRequest.error),
        });
        reject(deleteRequest.error);
      };
    });
  }

  // Clear the queue (useful for logout)
  async clearQueue(): Promise<void> {
    await this.ensureDBInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([QUEUE_STORE_NAME], "readwrite");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        console.log("Cleared offline queue");
        resolve();
      };

      clearRequest.onerror = () => {
        console.error("Failed to clear queue", clearRequest.error);
        reject(clearRequest.error);
      };
    });
  }

  async processRequest(request: QueuedRequest, authToken?: string): Promise<boolean> {
    try {
      // Use the original headers from the queued request
      const headers = { ...request.headers };

      if (authToken) {
        if (headers.authorization) {
          headers.authorization = `Bearer ${authToken}`;
        } else {
          headers.Authorization = `Bearer ${authToken}`;
        }
      }

      const options: RequestInit = {
        method: request.method,
        headers,
      };

      if (request.body && request.method !== "GET") {
        options.body = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
      }

      const response = await fetch(request.url, options);
      if (response.ok) {
        await this.removeFromQueue(request.id);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      logger.error("Failed to process queued request", {
        error: JSON.stringify(error),
        requestUrl: request.url,
        body: request.body,
      });
      return false;
    }
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueue();
export default offlineQueue;
