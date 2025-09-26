import { DB_NAME, DB_VERSION, JOBS_STORE_NAME, type StoredJob } from "@/models/db.model";
import type { IJob } from "@/models/job.model";
import logger from "./logger";

class JobsDB {
  private db: IDBDatabase | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      // Don't await in constructor, but ensure DB is ready before operations
      this.initDB().catch(console.error);
    }
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("Opening IndexedDB:", DB_NAME, "version:", DB_VERSION);
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error("Failed to open IndexedDB", { error: JSON.stringify(request.error) });
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
  async saveJob(job: IJob, updateLastSynced = true): Promise<void> {
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        logger.error("Database still not ready after initialization");
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME], "readwrite");
      const store = transaction.objectStore(JOBS_STORE_NAME);

      // Get existing job to check sync status
      const getRequest = store.get(job.id);

      getRequest.onsuccess = async () => {
        const existingJob = getRequest.result as StoredJob | undefined;
        const now = Date.now();
        const lastSynced = updateLastSynced ? now : existingJob?.lastSynced || now;

        const storedJob: StoredJob = {
          id: job.id,
          data: job,
          lastSynced,
        };

        const putRequest = store.put(storedJob);

        putRequest.onsuccess = () => {
          console.log("Successfully saved job to IndexedDB:", job.id);
          resolve();
        };
        putRequest.onerror = () => {
          const jobForLogging = { ...job, tasks: [] }; // send less data to Mixpanel
          logger.error("Failed to save job to IndexedDB", {
            job: jobForLogging,
            error: JSON.stringify(putRequest.error),
          });
          reject(putRequest.error);
        };
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getJob(id: number): Promise<IJob | null> {
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
          // Include sync status in the job data
          const jobWithSyncStatus: IJob = {
            ...storedJob.data,
            lastSynced: storedJob.lastSynced,
          };
          resolve(jobWithSyncStatus);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getAllJobs(): Promise<IJob[]> {
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
        const jobs = storedJobs.map((storedJob) => ({
          ...storedJob.data,
          lastSynced: storedJob.lastSynced,
        }));
        resolve(jobs);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  // Clear all data (useful for logout)
  async clearAll(): Promise<void> {
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME], "readwrite");
      const store = transaction.objectStore(JOBS_STORE_NAME);

      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        console.log("Cleared all jobs from IndexedDB");
        resolve();
      };
      clearRequest.onerror = () => {
        console.error("Failed to clear jobs:", clearRequest.error);
        reject(clearRequest.error);
      };
    });
  }
}

// Create singleton instance
export const jobsDB = new JobsDB();
export default jobsDB;
