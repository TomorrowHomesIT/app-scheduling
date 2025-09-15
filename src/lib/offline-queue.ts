"use client";

import { DB_NAME, DB_VERSION, STORE_NAME, type QueuedRequest } from "@/models/db.model";

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
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  // Add a request to the queue
  async queueRequest(
    url: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    body?: unknown,
    headers?: Record<string, string>,
    maxAttempts = 10,
  ): Promise<{ success: boolean; queued: boolean; response?: Response }> {
    const queuedRequest: QueuedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      url,
      method,
      body,
      headers: { "Content-Type": "application/json", ...headers },
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts,
    };

    // Try to make the request immediately if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const response = await this.makeRequest(queuedRequest);
        if (response.ok) {
          return { success: true, queued: false, response };
        }
      } catch (error) {
        // Network error, fall through to queue
        console.log("Request failed, queuing for retry:", error);
      }
    }

    // Queue the request for later processing by service worker
    await this.addToQueue(queuedRequest);
    return { success: false, queued: true };
  }

  private async addToQueue(request: QueuedRequest): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const addRequest = store.add(request);

      addRequest.onsuccess = () => {
        console.log(`Added request ${request.id} to queue`);
        resolve();
      };

      addRequest.onerror = () => {
        console.error("Failed to add request to queue:", addRequest.error);
        reject(addRequest.error);
      };
    });
  }

  private async getQueue(): Promise<QueuedRequest[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
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

  private async makeRequest(request: QueuedRequest): Promise<Response> {
    const options: RequestInit = {
      method: request.method,
      headers: request.headers,
    };

    if (request.body && request.method !== "GET") {
      options.body = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
    }

    return fetch(request.url, options);
  }

  async getQueueCount() {
    try {
      const queue = await this.getQueue();
      return queue.length;
    } catch (error) {
      console.error("Failed to get queue status:", error);
      return 0;
    }
  }

  // Clear the queue (useful for logout)
  async clearQueue(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
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
