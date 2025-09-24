/**
 * Main App Sync Manager
 *
 * Handles periodic syncing of user jobs with localStorage tracking
 * Runs in the main thread with visibility change and interval triggers
 */

import useJobStore from "@/store/job/job-store";
import { isUserAuthenticated } from "@/lib/supabase/client";
import { jobsDB } from "@/lib/jobs-db";
import { offlineQueue } from "@/lib/offline-queue";
import type { IJob } from "@/models";

interface SyncConfig {
  syncIntervalMs: number;
  storageKey: string;
}

interface SyncState {
  lastSync: number;
  isSyncing: boolean;
  isOnline: boolean;
  isVisible: boolean;
}

class SyncManager {
  private config: SyncConfig;
  private state: SyncState;
  private intervalId: NodeJS.Timeout | null = null;
  private syncCallbacks: Array<(isSyncing: boolean) => void> = [];

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      syncIntervalMs: 30 * 60 * 1000, // 30 minutes
      storageKey: "app-sync-state",
      ...config,
    };

    this.state = {
      lastSync: this.getStoredLastSync(),
      isSyncing: false,
      isOnline: navigator.onLine,
      isVisible: !document.hidden,
    };

    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private getStoredLastSync(): number {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.warn("Failed to read sync state from localStorage:", error);
      return 0;
    }
  }

  private setStoredLastSync(timestamp: number): void {
    try {
      localStorage.setItem(this.config.storageKey, timestamp.toString());
      this.state.lastSync = timestamp;
    } catch (error) {
      console.warn("Failed to write sync state to localStorage:", error);
    }
  }

  private setupEventListeners(): void {
    // Listen for visibility changes
    document.addEventListener("visibilitychange", () => {
      this.state.isVisible = !document.hidden;
      if (this.state.isVisible) {
        console.log("App became visible - checking if sync needed");
        this.triggerSyncIfNeeded("visibility");
      }
    });

    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.state.isOnline = true;
      console.log("App came online - checking if sync needed");
      this.triggerSyncIfNeeded("online");
    });

    window.addEventListener("offline", () => {
      this.state.isOnline = false;
      console.log("App went offline - sync will be paused");
    });
  }

  private startPeriodicSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.state.isVisible && this.state.isOnline) {
        this.triggerSyncIfNeeded("interval");
      }
    }, this.config.syncIntervalMs);

    console.log(`Started periodic sync (every ${this.config.syncIntervalMs / 60000} minutes)`);
  }

  private async triggerSyncIfNeeded(reason: string): Promise<void> {
    if (this.state.isSyncing) {
      console.log(`Sync already in progress - skipping ${reason} trigger`);
      return;
    }

    if (!this.state.isOnline) {
      console.log(`App is offline - skipping ${reason} trigger`);
      return;
    }

    const now = Date.now();
    const timeSinceLastSync = now - this.state.lastSync;

    const syncIsDue = timeSinceLastSync >= this.config.syncIntervalMs;
    const justCameOnline = reason === "online";
    if (!syncIsDue && !justCameOnline) {
      console.log(`Sync interval active - skipping ${reason} trigger (${Math.round(timeSinceLastSync / 1000)}s ago)`);
      return;
    }

    console.log(`Triggering sync due to ${reason} (${Math.round(timeSinceLastSync / 1000)}s since last sync)`);
    await this.performUserJobsSync();
  }

  private async performUserJobsSync(): Promise<void> {
    if (this.state.isSyncing) return;

    const isAuthenticated = await isUserAuthenticated();
    if (!isAuthenticated) {
      console.log("User not authenticated - aborting sync");
      return;
    }

    console.log("Starting user jobs sync...");
    this.state.isSyncing = true;
    this.notifySyncCallbacks(true);

    try {
      // Check for queued requests - if any exist, abort full sync
      const queueCount = await offlineQueue.getQueueCount();
      if (queueCount > 0) {
        console.log(`Found ${queueCount} queued requests - aborting sync to prevent conflicts`);
        return;
      }

      // Perform job-level sync with conflict detection
      await this.performJobLevelSync();

      // Update last sync timestamp
      this.setStoredLastSync(Date.now());
      console.log("User jobs sync completed successfully");
    } catch (error) {
      console.error("User jobs sync failed:", error);
    } finally {
      this.state.isSyncing = false;
      this.notifySyncCallbacks(false);
    }
  }

  private async performJobLevelSync(): Promise<void> {
    const { fetchUserJobsFromApi } = useJobStore.getState();

    try {
      const userJobs: IJob[] = await fetchUserJobsFromApi();
      const localJobs = await jobsDB.getAllJobs();
      const localJobsMap = new Map(localJobs.map((job) => [job.id, job]));

      const safeJobsToUpdate: IJob[] = [];
      const conflictedJobs: string[] = [];

      // Check each job for conflicts
      for (const freshJob of userJobs) {
        const localJob = localJobsMap.get(freshJob.id);

        if (!localJob) {
          // New job, safe to add
          safeJobsToUpdate.push(freshJob);
          await jobsDB.saveJob(freshJob);
          continue;
        }

        // Check if local job has unsaved changes
        const hasLocalChanges = await offlineQueue.jobHasPendingRequests(freshJob.id);

        if (hasLocalChanges) {
          console.log(`Job ${freshJob.id} has local changes - skipping sync to prevent overwrite`);
          conflictedJobs.push(`Job ${freshJob.name || freshJob.id}`);
          // Keep the local version
          safeJobsToUpdate.push(localJob);
        } else {
          // No local changes, safe to update with fresh data
          safeJobsToUpdate.push(freshJob);
          await jobsDB.saveJob(freshJob);
        }
      }

      if (conflictedJobs.length > 0) {
        console.log(`Sync completed with conflicts. ${conflictedJobs.length} jobs preserved locally:`, conflictedJobs);
      } else {
        console.log(`Job-level sync completed successfully. Updated ${safeJobsToUpdate.length} jobs.`);
      }
    } catch (error) {
      console.error("Failed to fetch jobs for sync:", error);
      throw error;
    }
  }

  private notifySyncCallbacks(isSyncing: boolean): void {
    this.syncCallbacks.forEach((callback) => {
      try {
        callback(isSyncing);
      } catch (error) {
        console.error("Error in sync callback:", error);
      }
    });
  }

  // Public API
  public async triggerManualUserJobsSync(): Promise<void> {
    console.log("Manual sync requested");
    await this.performUserJobsSync();
  }

  public onSyncStatusChange(callback: (isSyncing: boolean) => void): () => void {
    this.syncCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.syncCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncCallbacks.splice(index, 1);
      }
    };
  }

  public getSyncState(): Readonly<SyncState> {
    return { ...this.state };
  }

  public getLastSyncTime(): number {
    return this.state.lastSync;
  }

  public isSyncingNow(): boolean {
    return this.state.isSyncing;
  }

  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    document.removeEventListener("visibilitychange", () => {});
    window.removeEventListener("online", () => {});
    window.removeEventListener("offline", () => {});

    this.syncCallbacks = [];
    console.log("Sync manager destroyed");
  }
}

// Export a singleton instance
export const syncManager = new SyncManager();

// Export the class for testing or custom instances
export { SyncManager };
export type { SyncConfig, SyncState };
