import { create } from "zustand";
import { toast } from "./toast-store";
import logger from "@/lib/logger";

interface AppStore {
  isRestarting: boolean;
  showUpdateDialog: boolean;
  restartApp: () => Promise<void>;
  hardRestartApp: () => Promise<void>;
  showServiceWorkerUpdateDialog: () => void;
  hideServiceWorkerUpdateDialog: () => void;
  confirmServiceWorkerUpdate: () => void;
}

const useAppStore = create<AppStore>((set) => ({
  isRestarting: false,
  showUpdateDialog: false,

  restartApp: async () => {
    window.location.reload();
  },

  hardRestartApp: async () => {
    set({ isRestarting: true });
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.log("Unregistering service worker:", registration.scope);
          await registration.unregister();
        }
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        console.log("Clearing caches:", cacheNames);
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }

      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      logger.error("Error during full refresh in hardRestartApp", { error: JSON.stringify(error) });
      toast.error("Error during full refresh");
    } finally {
      set({ isRestarting: false });
    }
  },

  showServiceWorkerUpdateDialog: () => {
    set({ showUpdateDialog: true });
  },

  hideServiceWorkerUpdateDialog: () => {
    set({ showUpdateDialog: false });
  },

  confirmServiceWorkerUpdate: () => {
    set({ showUpdateDialog: false });
    window.location.reload();
  },
}));

export default useAppStore;
