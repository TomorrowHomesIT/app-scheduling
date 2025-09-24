import type { IJob } from "./job.model";

// IndexedDB configuration
export const DB_NAME = "AppSchedulingDB";
export const DB_VERSION = 4; // Incremented to remove tasks store

// Store names
export const QUEUE_STORE_NAME = "queuedRequests";
export const JOBS_STORE_NAME = "jobs";

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

export interface StoredJob {
  id: number;
  data: IJob; // IJob data with inline task sync tracking
  lastUpdated: number;
  lastSynced: number;
}
