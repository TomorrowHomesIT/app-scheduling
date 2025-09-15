// IndexedDB queue processing functions
export const DB_NAME = "OfflineQueueDB";
export const DB_VERSION = 1;
export const STORE_NAME = "queuedRequests";

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
