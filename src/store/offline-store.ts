import { create } from "zustand";
import { offlineDB } from "@/lib/offline-db";

interface IOfflineStore {
  isOfflineModeEnabled: boolean;
  isInitialized: boolean;
  initializeOfflineMode: () => Promise<boolean>;
  setOfflineMode: (enabled: boolean) => Promise<void>;
}

const useOfflineStore = create<IOfflineStore>((set) => ({
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
      set({ isOfflineModeEnabled: enabled });
      
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: "OFFLINE_MODE_CHANGED",
          offlineMode: enabled,
        });
      }
    } catch (error) {
      console.error("Failed to set offline mode:", error);
      throw error;
    }
  },
}));

export default useOfflineStore;