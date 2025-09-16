import { DB_NAME, DB_VERSION, QUEUE_STORE_NAME, JOBS_STORE_NAME, TASKS_STORE_NAME } from "@/models/db.model";

// Initialize IndexedDB with all stores
export const swInitIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Service Worker: Failed to open IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log("Service Worker: IndexedDB opened successfully");
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log("Service Worker: IndexedDB upgrade needed, creating stores...");
      const db = (event.target as IDBOpenDBRequest).result;

      // Create queue store if it doesn't exist
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        console.log("Service Worker: Creating queue store:", QUEUE_STORE_NAME);
        const store = db.createObjectStore(QUEUE_STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Create jobs store if it doesn't exist
      if (!db.objectStoreNames.contains(JOBS_STORE_NAME)) {
        console.log("Service Worker: Creating jobs store:", JOBS_STORE_NAME);
        const jobsStore = db.createObjectStore(JOBS_STORE_NAME, { keyPath: "id" });
        jobsStore.createIndex("lastUpdated", "lastUpdated", { unique: false });
        jobsStore.createIndex("lastSynced", "lastSynced", { unique: false });
      }

      // Create tasks store if it doesn't exist
      if (!db.objectStoreNames.contains(TASKS_STORE_NAME)) {
        console.log("Service Worker: Creating tasks store:", TASKS_STORE_NAME);
        const tasksStore = db.createObjectStore(TASKS_STORE_NAME, { keyPath: "id" });
        tasksStore.createIndex("jobId", "jobId", { unique: false });
        tasksStore.createIndex("lastUpdated", "lastUpdated", { unique: false });
        tasksStore.createIndex("lastSynced", "lastSynced", { unique: false });
      }
    };
  });
};
