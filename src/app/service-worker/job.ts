import { JOBS_STORE_NAME, TASKS_STORE_NAME, type StoredJob, type StoredTask } from "@/models/db.model";
import { swInitIndexedDB } from "./db";
import type { IJob } from "@/models";
import { swCheckOfflineMode } from "./offline";

let jobSyncInterval: NodeJS.Timeout | null = null;

/**
 * Sync all stored jobs every x minutes
 */
const JOB_SYNC_INTERVAL = 5 * 60 * 1000;

// Function to check if there are pending updates
const hasPendingUpdates = async (): Promise<boolean> => {
  try {
    const db = await swInitIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([JOBS_STORE_NAME, TASKS_STORE_NAME], "readonly");
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
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    return false;
  }
};

// Function to sync jobs from API
const syncJobs = async (): Promise<void> => {
  try {
    // Check if offline mode is enabled
    const offlineModeEnabled = await swCheckOfflineMode();
    if (!offlineModeEnabled) {
      console.log("Skipping job sync - offline mode is disabled");
      return;
    }

    console.log("Starting job sync...");

    // Check if there are pending updates
    const hasPending = await hasPendingUpdates();
    if (hasPending) {
      console.log("Skipping job sync - there are pending updates");
      return;
    }

    // Only sync if online
    if (!navigator.onLine) {
      console.log("Skipping job sync - offline");
      return;
    }

    // Fetch user jobs from API
    const response = await fetch("/api/user/jobs");
    if (!response.ok) {
      console.warn("Failed to fetch jobs from API:", response.status);
      return;
    }

    const jobs: IJob[] = await response.json();
    if (!jobs || !Array.isArray(jobs)) {
      console.warn("Invalid jobs data received");
      return;
    }

    // Save jobs to IndexedDB
    const db = await swInitIndexedDB();
    const transaction = db.transaction([JOBS_STORE_NAME], "readwrite");
    const store = transaction.objectStore(JOBS_STORE_NAME);

    let completed = 0;
    const totalJobs = jobs.length;

    if (totalJobs === 0) {
      console.log("No jobs to sync");
      return;
    }

    jobs.forEach((job) => {
      const storedJob: StoredJob = {
        id: job.id,
        data: job,
        lastUpdated: Date.now(),
        lastSynced: Date.now(),
      };

      const putRequest = store.put(storedJob);
      putRequest.onsuccess = () => {
        completed++;
        if (completed === totalJobs) {
          console.log(`Successfully synced ${totalJobs} jobs`);
        }
      };
      putRequest.onerror = () => {
        console.error("Failed to save job to IndexedDB:", putRequest.error);
        completed++;
      };
    });
  } catch (error) {
    console.error("Job sync failed:", error);
  }
};

export const swStartJobSync = () => {
  if (jobSyncInterval) {
    clearInterval(jobSyncInterval);
  }

  const interval = JOB_SYNC_INTERVAL;
  jobSyncInterval = setInterval(() => {
    syncJobs();
  }, interval);

  console.log(`Started periodic job sync (every ${interval / 60000} minutes)`);
};

export const swStopJobSync = () => {
  if (jobSyncInterval) {
    clearInterval(jobSyncInterval);
    jobSyncInterval = null;
    console.log("Stopped periodic job sync");
  }
};
