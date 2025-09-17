"use client";

import {
  DB_NAME,
  DB_VERSION,
  JOBS_STORE_NAME,
  TASKS_STORE_NAME,
  type StoredJob,
  type StoredTask,
} from "@/models/db.model";
import type { IJob, IJobTask } from "@/models/job.model";
import useOfflineStore from "@/store/offline-store";

class JobsDB {
  private db: IDBDatabase | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      // Don't await in constructor, but ensure DB is ready before operations
      this.initDB().catch(console.error);
    }
  }

  private isOfflineModeEnabled(): boolean {
    return useOfflineStore.getState().isOfflineModeEnabled;
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("Opening IndexedDB:", DB_NAME, "version:", DB_VERSION);
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log("IndexedDB opened successfully");
        this.db = request.result;
        resolve();
      };
    });
  }

  private async ensureDBReady(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  // Job operations
  async saveJob(job: IJob): Promise<void> {
    if (!this.isOfflineModeEnabled()) {
      return;
    }
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.log("Database still not ready after initialization");
        reject(new Error("Database not initialized"));
        return;
      }

      const storedJob: StoredJob = {
        id: job.id,
        data: job,
        lastUpdated: Date.now(),
        lastSynced: Date.now(),
      };

      const transaction = this.db.transaction([JOBS_STORE_NAME], "readwrite");
      const store = transaction.objectStore(JOBS_STORE_NAME);
      const putRequest = store.put(storedJob);

      putRequest.onsuccess = () => {
        console.log("Successfully saved job to IndexedDB:", job.id);
        resolve();
      };
      putRequest.onerror = () => {
        console.error("Failed to save job to IndexedDB:", putRequest.error);
        reject(putRequest.error);
      };
    });
  }

  async getJob(id: number): Promise<IJob | null> {
    if (!this.isOfflineModeEnabled()) {
      return null;
    }
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME], "readonly");
      const store = transaction.objectStore(JOBS_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const storedJob = getRequest.result as StoredJob | undefined;
        resolve(storedJob ? storedJob.data : null);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getAllJobs(): Promise<IJob[]> {
    if (!this.isOfflineModeEnabled()) {
      return [];
    }
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME], "readonly");
      const store = transaction.objectStore(JOBS_STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const storedJobs = (getAllRequest.result as StoredJob[]) || [];
        const jobs = storedJobs.map((storedJob) => storedJob.data);
        resolve(jobs);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  async updateJobLastUpdated(id: number): Promise<void> {
    if (!this.isOfflineModeEnabled()) {
      return;
    }
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME], "readwrite");
      const store = transaction.objectStore(JOBS_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const storedJob = getRequest.result as StoredJob;
        if (storedJob) {
          storedJob.lastUpdated = Date.now();
          const putRequest = store.put(storedJob);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async updateJobLastSynced(id: number): Promise<void> {
    if (!this.isOfflineModeEnabled()) {
      return;
    }
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME], "readwrite");
      const store = transaction.objectStore(JOBS_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const storedJob = getRequest.result as StoredJob;
        if (storedJob) {
          storedJob.lastSynced = Date.now();
          const putRequest = store.put(storedJob);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getJobSyncStatus(
    id: number,
  ): Promise<{ lastUpdated: number; lastSynced: number; hasPendingUpdates: boolean } | null> {
    if (!this.isOfflineModeEnabled()) {
      return null;
    }
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME], "readonly");
      const store = transaction.objectStore(JOBS_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const storedJob = getRequest.result as StoredJob | undefined;
        if (storedJob) {
          resolve({
            lastUpdated: storedJob.lastUpdated,
            lastSynced: storedJob.lastSynced,
            hasPendingUpdates: storedJob.lastUpdated > storedJob.lastSynced,
          });
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Task operations
  async saveTask(jobId: number, task: IJobTask): Promise<void> {
    if (!this.isOfflineModeEnabled()) {
      return;
    }
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const storedTask: StoredTask = {
        id: task.id,
        jobId: jobId,
        data: task,
        lastUpdated: Date.now(),
        lastSynced: Date.now(),
      };

      const transaction = this.db.transaction([TASKS_STORE_NAME], "readwrite");
      const store = transaction.objectStore(TASKS_STORE_NAME);
      const putRequest = store.put(storedTask);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  }

  async updateTaskLastUpdated(jobId: number, taskId: number): Promise<void> {
    if (!this.isOfflineModeEnabled()) {
      return;
    }
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([TASKS_STORE_NAME], "readwrite");
      const store = transaction.objectStore(TASKS_STORE_NAME);
      const getRequest = store.get(taskId);

      getRequest.onsuccess = () => {
        const storedTask = getRequest.result as StoredTask;
        if (storedTask && storedTask.jobId === jobId) {
          storedTask.lastUpdated = Date.now();
          const putRequest = store.put(storedTask);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Check if there are pending updates (local changes not yet synced)
  async hasPendingUpdates(): Promise<boolean> {
    if (!this.isOfflineModeEnabled()) {
      return false;
    }
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME, TASKS_STORE_NAME], "readonly");
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
  }

  // Clear all data (useful for logout or disabling offline mode)
  async clearAll(): Promise<void> {
    // Always allow clearing, even when offline mode is disabled
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME, TASKS_STORE_NAME], "readwrite");
      const jobsStore = transaction.objectStore(JOBS_STORE_NAME);
      const tasksStore = transaction.objectStore(TASKS_STORE_NAME);

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };

      const clearJobsRequest = jobsStore.clear();
      clearJobsRequest.onsuccess = () => checkComplete();
      clearJobsRequest.onerror = () => reject(clearJobsRequest.error);

      const clearTasksRequest = tasksStore.clear();
      clearTasksRequest.onsuccess = () => checkComplete();
      clearTasksRequest.onerror = () => reject(clearTasksRequest.error);
    });
  }
}

// Create singleton instance
export const jobsDB = new JobsDB();
export default jobsDB;
