export interface IOfflineSettings {
  offlineMode: boolean;
}

class OfflineDB {
  private dbName = "app-offline-settings";
  private version = 1;
  private storeName = "settings";
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async getSettings(): Promise<IOfflineSettings> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get("settings");

      request.onsuccess = () => {
        const settings = request.result || { offlineMode: false };
        resolve(settings);
      };

      request.onerror = () => {
        console.error("Failed to get settings:", request.error);
        reject(request.error);
      };
    });
  }

  async setSettings(settings: IOfflineSettings): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put(settings, "settings");

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Failed to set settings:", request.error);
        reject(request.error);
      };
    });
  }

  async setOfflineMode(enabled: boolean): Promise<void> {
    const settings = await this.getSettings();
    settings.offlineMode = enabled;
    await this.setSettings(settings);
  }

  async getOfflineMode(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.offlineMode;
  }
}

export const offlineDB = new OfflineDB();
