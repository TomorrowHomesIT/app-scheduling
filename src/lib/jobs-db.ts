import {
  DB_NAME,
  DB_VERSION,
  JOBS_STORE_NAME,
  type StoredJob,
} from "@/models/db.model";
import type { IJob } from "@/models/job.model";

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
  async saveJob(job: IJob, preservePendingStatus: boolean = false): Promise<void> {
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.log("Database still not ready after initialization");
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
        
        const storedJob: StoredJob = {
          id: job.id,
          data: job,
          lastUpdated: preservePendingStatus && existingJob && existingJob.lastUpdated > existingJob.lastSynced
            ? now  // Keep it marked as updated if it had pending changes
            : job.lastUpdated || now,
          lastSynced: preservePendingStatus && existingJob && existingJob.lastUpdated > existingJob.lastSynced
            ? existingJob.lastSynced  // Preserve the old sync time if it had pending changes
            : job.lastSynced || now,
        };

        const putRequest = store.put(storedJob);

        putRequest.onsuccess = () => {
          console.log("Successfully saved job to IndexedDB:", job.id);
          resolve();
        };
        putRequest.onerror = () => {
          console.error("Failed to save job to IndexedDB:", putRequest.error);
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
            lastUpdated: storedJob.lastUpdated,
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
          lastUpdated: storedJob.lastUpdated,
          lastSynced: storedJob.lastSynced,
        }));
        resolve(jobs);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  async updateJobLastUpdated(id: number): Promise<void> {
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


  // Check if there are pending updates (local changes not yet synced)
  async hasPendingUpdates(): Promise<boolean> {
    await this.ensureDBReady();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([JOBS_STORE_NAME], "readonly");
      const jobsStore = transaction.objectStore(JOBS_STORE_NAME);

      const jobsRequest = jobsStore.getAll();
      jobsRequest.onsuccess = () => {
        const jobs = (jobsRequest.result as StoredJob[]) || [];
        // Check if any job has pending changes at the job level OR task level
        const hasPending = jobs.some((job) => {
          // Job level changes
          if (job.lastUpdated > job.lastSynced) return true;
          
          // Task level changes (check inline task sync status)
          if (job.data.tasks) {
            return job.data.tasks.some(task => 
              task.lastUpdated && task.lastSynced && task.lastUpdated > task.lastSynced
            );
          }
          return false;
        });
        resolve(hasPending);
      };
      jobsRequest.onerror = () => reject(jobsRequest.error);
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
