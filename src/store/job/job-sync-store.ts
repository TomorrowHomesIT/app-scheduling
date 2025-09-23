import { create } from "zustand";
import { syncManager } from "@/lib/sync-manager";
import type { SyncState } from "@/lib/sync-manager";

interface JobSyncStore {
  // State
  syncState: SyncState;
  lastSyncTime: number;
  
  // Actions
  syncUserJobs: () => Promise<void>;
  getSyncState: () => SyncState;
  getLastSyncTime: () => number;
  isSyncingNow: () => boolean;
}

const useJobSyncStore = create<JobSyncStore>((set, get) => {
  // Initialize with current sync manager state
  const initialState = syncManager.getSyncState();
  const initialLastSyncTime = syncManager.getLastSyncTime();

  // Subscribe to sync manager changes and update store
  syncManager.onSyncStatusChange(() => {
    set({
      syncState: syncManager.getSyncState(),
      lastSyncTime: syncManager.getLastSyncTime()
    });
  });

  return {
    // Initial state
    syncState: initialState,
    lastSyncTime: initialLastSyncTime,

    // Actions
    syncUserJobs: async () => {
      await syncManager.triggerManualUserJobsSync();
      // State will be updated automatically via the subscription above
    },

    getSyncState: () => {
      return get().syncState;
    },

    getLastSyncTime: () => {
      return get().lastSyncTime;
    },

    isSyncingNow: () => {
      return get().syncState.isSyncing;
    }
  };
});

export default useJobSyncStore;