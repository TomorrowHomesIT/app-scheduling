import {
  DB_NAME,
  DB_VERSION,
  JOBS_STORE_NAME,
  QUEUE_STORE_NAME,
  TASKS_STORE_NAME,
  type QueuedRequest,
} from "@/models/db.model";

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
        console.error("Failed to open IndexedDB:", request.error);
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
          jobsStore.createIndex("lastUpdated", "lastUpdated", { unique: false });
          jobsStore.createIndex("lastSynced", "lastSynced", { unique: false });
        }

        // Create tasks store if it doesn't exist
        if (!db.objectStoreNames.contains(TASKS_STORE_NAME)) {
          console.log("Creating tasks store:", TASKS_STORE_NAME);
          const tasksStore = db.createObjectStore(TASKS_STORE_NAME, { keyPath: "id" });
          tasksStore.createIndex("jobId", "jobId", { unique: false });
          tasksStore.createIndex("lastUpdated", "lastUpdated", { unique: false });
          tasksStore.createIndex("lastSynced", "lastSynced", { unique: false });
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
        console.error("Failed to get queue from IndexedDB:", getAllRequest.error);
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
      console.error("Failed to get queue status:", error);
      return 0;
    }
  }

  // Get full queue for UI display
  async getQueueItems(): Promise<QueuedRequest[]> {
    try {
      await this.ensureDBInitialized();
      return await this.getQueue();
    } catch (error) {
      console.error("Failed to get queue items:", error);
      return [];
    }
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
        console.error("Failed to clear queue:", clearRequest.error);
        reject(clearRequest.error);
      };
    });
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueue();
export default offlineQueue;
