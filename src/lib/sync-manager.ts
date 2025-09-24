/**
 * Main App Sync Manager
 *
 * Handles periodic syncing of user jobs with localStorage tracking
 * Runs in the main thread with visibility change and interval triggers
 */

import useJobStore from "@/store/job/job-store";
import useSupplierStore from "@/store/supplier-store";
import { isUserAuthenticated } from "@/lib/supabase/client";
import { jobsDB } from "@/lib/jobs-db";
import { offlineQueue } from "@/lib/offline-queue";
import type { IJob } from "@/models";

interface SyncConfig {
  jobSyncIntervalMs: number;
  supplierSyncIntervalMs: number;
  storageKey: string;
}

interface SyncState {
  lastSync: number;
  lastSupplierSync: number;
  isSyncing: boolean;
  isSupplierSyncing: boolean;
  isOnline: boolean;
  isVisible: boolean;
}

class SyncManager {
  private config: SyncConfig;
  private state: SyncState;
  private intervalId: NodeJS.Timeout | null = null;
  private supplierIntervalId: NodeJS.Timeout | null = null;
  private syncCallbacks: Array<(isSyncing: boolean) => void> = [];

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      jobSyncIntervalMs: 30 * 60 * 1000, // 30 minutes
      supplierSyncIntervalMs: 12 * 60 * 60 * 1000, // 12 hours
      storageKey: "app-sync-state",
      ...config,
    };

    this.state = {
      lastSync: this.getStoredLastSync(),
      lastSupplierSync: this.getStoredLastSupplierSync(),
      isSyncing: false,
      isSupplierSyncing: false,
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

  private getStoredLastSupplierSync(): number {
    try {
      const stored = localStorage.getItem(`${this.config.storageKey}-suppliers`);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.warn("Failed to read supplier sync state from localStorage:", error);
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

  private setStoredLastSupplierSync(timestamp: number): void {
    try {
      localStorage.setItem(`${this.config.storageKey}-suppliers`, timestamp.toString());
      this.state.lastSupplierSync = timestamp;
    } catch (error) {
      console.warn("Failed to write supplier sync state to localStorage:", error);
    }
  }

  private setupEventListeners(): void {
    // Listen for visibility changes
    document.addEventListener("visibilitychange", () => {
      this.state.isVisible = !document.hidden;
      if (this.state.isVisible) {
        console.log("App became visible - checking if sync needed");
        this.triggerJobSyncIfNeeded("visibility");
        this.triggerSupplierSyncIfNeeded("visibility");
      }
    });

    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.state.isOnline = true;
      console.log("App came online - checking if sync needed");
      this.triggerJobSyncIfNeeded("online");
      this.triggerSupplierSyncIfNeeded("online");
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
        this.triggerJobSyncIfNeeded("interval");
        this.triggerSupplierSyncIfNeeded("interval");
      }
    }, this.config.jobSyncIntervalMs);

    console.log(`Started periodic sync (every ${this.config.jobSyncIntervalMs / 60000} minutes)`);
  }

  private async triggerJobSyncIfNeeded(reason: string): Promise<void> {
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

    const syncIsDue = timeSinceLastSync >= this.config.jobSyncIntervalMs;
    const justCameOnline = reason === "online";

    if (!syncIsDue && !justCameOnline) {
      console.log(`Sync interval active - skipping ${reason} trigger (${Math.round(timeSinceLastSync / 1000)}s ago)`);
      return;
    }

    console.log(`Triggering sync due to ${reason} (${Math.round(timeSinceLastSync / 1000)}s since last sync)`);
    await this.performUserJobsSync();
  }

  private async triggerSupplierSyncIfNeeded(reason: string): Promise<void> {
    if (this.state.isSupplierSyncing) {
      console.log(`Supplier sync already in progress - skipping ${reason} trigger`);
      return;
    }

    if (!this.state.isOnline) {
      console.log(`App is offline - skipping ${reason} supplier trigger`);
      return;
    }

    const now = Date.now();
    const timeSinceLastSupplierSync = now - this.state.lastSupplierSync;

    const supplierSyncIsDue = timeSinceLastSupplierSync >= this.config.supplierSyncIntervalMs;
    const justCameOnline = reason === "online";

    if (!supplierSyncIsDue && !justCameOnline) {
      console.log(
        `Supplier sync interval active - skipping ${reason} trigger (${Math.round(timeSinceLastSupplierSync / 1000)}s ago)`,
      );
      return;
    }

    console.log(
      `Triggering supplier sync due to ${reason} (${Math.round(timeSinceLastSupplierSync / 1000)}s since last sync)`,
    );
    await this.performSupplierSync();
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

  private async performSupplierSync(): Promise<void> {
    if (this.state.isSupplierSyncing) return;

    const isAuthenticated = await isUserAuthenticated();
    if (!isAuthenticated) {
      console.log("User not authenticated - aborting supplier sync");
      return;
    }

    console.log("Starting supplier sync...");
    this.state.isSupplierSyncing = true;

    try {
      // Use the supplier store's loadSuppliers method
      const { loadSuppliers } = useSupplierStore.getState();
      await loadSuppliers();

      // Update last supplier sync timestamp
      this.setStoredLastSupplierSync(Date.now());
      console.log("Supplier sync completed successfully");
    } catch (error) {
      console.error("Supplier sync failed:", error);
    } finally {
      this.state.isSupplierSyncing = false;
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

  public getLastSupplierSyncTime(): number {
    return this.state.lastSupplierSync;
  }

  public isSyncingNow(): boolean {
    return this.state.isSyncing;
  }

  public isSupplierSyncingNow(): boolean {
    return this.state.isSupplierSyncing;
  }

  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.supplierIntervalId) {
      clearInterval(this.supplierIntervalId);
      this.supplierIntervalId = null;
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
