// Shared function to check if offline mode is enabled from IndexedDB
export const swCheckOfflineMode = async (): Promise<boolean> => {
  try {
    return new Promise((resolve) => {
      const request = indexedDB.open("app-offline-settings", 1);

      request.onerror = () => {
        console.log("Could not open offline settings DB, assuming offline mode disabled");
        resolve(false);
      };

      request.onsuccess = () => {
        const db = request.result;

        // Check if the object store exists
        if (!db.objectStoreNames.contains("settings")) {
          console.log("Settings store doesn't exist, assuming offline mode disabled");
          resolve(false);
          return;
        }

        const transaction = db.transaction(["settings"], "readonly");
        const store = transaction.objectStore("settings");
        const getRequest = store.get("settings");

        getRequest.onsuccess = () => {
          const settings = getRequest.result;
          const enabled = settings?.offlineMode || false;
          resolve(enabled);
        };

        getRequest.onerror = () => {
          console.log("Could not read offline settings, assuming disabled");
          resolve(false);
        };
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      };
    });
  } catch (error) {
    console.error("Error checking offline mode:", error);
    return false;
  }
};
