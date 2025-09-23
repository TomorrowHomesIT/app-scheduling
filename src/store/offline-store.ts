import { create } from "zustand";
import { offlineQueue } from "@/lib/offline-queue";
import { jobsDB } from "@/lib/jobs-db";

interface IOfflineStore {
  clearOfflineStores: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const useOfflineStore = create<IOfflineStore>((_, get) => ({
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
