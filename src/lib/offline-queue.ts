"use client";

export interface QueuedRequest {
  id: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
}

class OfflineQueue {
  private readonly STORAGE_KEY = "offline-queue";
  private isProcessing = false;
  private onlineListener: (() => void) | null = null;

  constructor() {
    // Only start listening if we're in the browser
    if (typeof window !== "undefined") {
      this.startListening();
    }
  }

  private startListening() {
    if (typeof window === "undefined") return;

    this.onlineListener = () => {
      if (navigator.onLine) {
        this.processQueue();
      }
    };
    window.addEventListener("online", this.onlineListener);

    // Process queue on startup if online
    if (navigator.onLine) {
      setTimeout(() => this.processQueue(), 1000);
    }
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

    // Queue the request for later
    this.addToQueue(queuedRequest);
    return { success: false, queued: true };
  }

  private addToQueue(request: QueuedRequest) {
    const queue = this.getQueue();
    queue.push(request);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
  }

  private getQueue(): QueuedRequest[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setQueue(queue: QueuedRequest[]) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
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

  // Process all queued requests
  async processQueue() {
    if (typeof navigator === "undefined" || this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    const queue = this.getQueue();
    const remainingQueue: QueuedRequest[] = [];

    for (const request of queue) {
      try {
        const response = await this.makeRequest(request);

        if (response.ok) {
          console.log(`Successfully processed queued request: ${request.method} ${request.url}`);
          // Request successful, don't add back to queue
        } else {
          // Server error, retry if under max attempts
          request.attempts++;
          if (request.attempts < request.maxAttempts) {
            remainingQueue.push(request);
          } else {
            // TODO log
            console.error(`Max attempts reached for request: ${request.method} ${request.url}`);
          }
        }
      } catch (error) {
        // Network error, retry if under max attempts
        request.attempts++;
        if (request.attempts < request.maxAttempts) {
          remainingQueue.push(request);
        } else {
          console.error(`Max attempts reached for request: ${request.method} ${request.url}`, error);
        }
      }
    }

    // Update queue with remaining requests
    this.setQueue(remainingQueue);
    this.isProcessing = false;
  }

  // Get current queue status
  getQueueStatus() {
    const queue = this.getQueue();
    return {
      count: queue.length,
      hasItems: queue.length > 0,
      items: queue,
    };
  }

  // Clear the queue (useful for logout)
  clearQueue() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Clean up listeners
  destroy() {
    if (typeof window !== "undefined" && this.onlineListener) {
      window.removeEventListener("online", this.onlineListener);
    }
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueue();
export default offlineQueue;
