import type { IJob, IJobTask } from "./job.model";

// IndexedDB configuration
export const DB_NAME = "AppSchedulingDB";
export const DB_VERSION = 3; // Incremented to add jobs and tasks stores

// Store names
export const QUEUE_STORE_NAME = "queuedRequests";
export const JOBS_STORE_NAME = "jobs";
export const TASKS_STORE_NAME = "tasks";

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
  data: IJob; // IJob data
  lastUpdated: number;
  lastSynced: number;
}

export interface StoredTask {
  id: number;
  jobId: number;
  data: IJobTask; // IJobTask data
  lastUpdated: number;
  lastSynced: number;
}
