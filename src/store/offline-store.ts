import { create } from "zustand";
import { offlineDB } from "@/lib/offline-db";
import { offlineQueue } from "@/lib/offline-queue";
import { jobsDB } from "@/lib/jobs-db";

interface IOfflineStore {
  isOfflineModeEnabled: boolean;
  isInitialized: boolean;
  initializeOfflineMode: () => Promise<boolean>;
  setOfflineMode: (enabled: boolean) => Promise<void>;
  clearOfflineStores: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const useOfflineStore = create<IOfflineStore>((set, get) => ({
  isOfflineModeEnabled: false,
  isInitialized: false,

  initializeOfflineMode: async () => {
    try {
      const isOfflineModeEnabled = await offlineDB.getOfflineMode();
      set({ isOfflineModeEnabled, isInitialized: true });
      return isOfflineModeEnabled;
    } catch (error) {
      console.error("Failed to initialize offline mode:", error);
      set({ isOfflineModeEnabled: false, isInitialized: true });
      return false;
    }
  },

  setOfflineMode: async (enabled: boolean) => {
    try {
      await offlineDB.setOfflineMode(enabled);

      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: "OFFLINE_MODE_CHANGED",
          offlineMode: enabled,
        });
        console.log(`Sent offline mode change to service worker controller: ${enabled ? "enabled" : "disabled"}`);
      }

      if (!enabled) {
        await get().clearOfflineStores();
      }

      set({ isOfflineModeEnabled: enabled });
    } catch (error) {
      console.error("Failed to set offline mode:", error);
      throw error;
    }
  },

  clearOfflineStores: async () => {
    await offlineQueue.clearQueue();
    await jobsDB.clearAll();
    await get().clearCache();
  },

  clearCache: async () => {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      console.log("Clearing caches:", cacheNames);
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
  },
}));

export default useOfflineStore;
