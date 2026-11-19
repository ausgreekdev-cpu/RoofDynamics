/**
 * RoofDynamics - Offline-First Sync Engine
 * IndexedDB-based offline write queue with background sync on reconnect.
 */

import { isNative } from "./nativeBridge";
import { getNetworkStatus, onNetworkChange } from "./nativeNetwork";
import { prefGet, prefSet } from "./nativePreferences";

const DB_NAME = "roofdynamics-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-writes";
const CACHE_STORE = "cached-data";

export interface PendingWrite {
  id: string;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  endpoint: string;
  body: any;
  timestamp: number;
  retries: number;
  status: "pending" | "syncing" | "failed";
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
}

class OfflineSyncEngine {
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private listeners: Array<(status: SyncStatus) => void> = [];
  private lastSyncAt: string | null = null;

  constructor() {
    this.initDB();
    void this.setupEventListeners();
    void this.restoreLastSync();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("status", "status", { unique: false });
        }

        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: "key" });
        }
      };
    });
  }

  private networkUnsubscribe: (() => void) | null = null;

  private async setupEventListeners(): Promise<void> {
    if (isNative()) {
      try {
        const status = await getNetworkStatus();
        this.isOnline = status.connected;
        this.notifyListeners();
      } catch {
        this.isOnline = navigator.onLine;
      }
      this.networkUnsubscribe = onNetworkChange((status) => {
        this.isOnline = status.connected;
        this.notifyListeners();
        if (status.connected) void this.syncPendingWrites();
      });
    } else {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.notifyListeners();
        this.syncPendingWrites();
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  private async restoreLastSync(): Promise<void> {
    try {
      const stored = await prefGet("lastSyncAt");
      if (stored) this.lastSyncAt = stored;
    } catch {
      // ignore
    }
  }

  private notifyListeners(): void {
    const status: SyncStatus = {
      isOnline: this.isOnline,
      pendingCount: 0,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
    };

    this.getPendingCount().then((count) => {
      status.pendingCount = count;
      this.listeners.forEach((listener) => listener(status));
    });
  }

  async getPendingCount(): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("status");
      const request = index.count(IDBKeyRange.only("pending"));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  }

  async queueWrite(write: Omit<PendingWrite, "id" | "timestamp" | "retries" | "status">): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    const pendingWrite: PendingWrite = {
      id: `write-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...write,
      timestamp: Date.now(),
      retries: 0,
      status: "pending",
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(pendingWrite);
      request.onsuccess = () => {
        this.notifyListeners();
        resolve(pendingWrite.id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingWrites(): Promise<PendingWrite[]> {
    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("status");
      const request = index.getAll(IDBKeyRange.only("pending"));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  async syncPendingWrites(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    this.notifyListeners();

    const pendingWrites = await this.getPendingWrites();

    for (const write of pendingWrites) {
      try {
        const response = await fetch(write.endpoint, {
          method: write.method,
          headers: { "Content-Type": "application/json" },
          body: write.body ? JSON.stringify(write.body) : undefined,
        });

        if (response.ok) {
          // Remove from queue
          await this.removeWrite(write.id);
          this.lastSyncAt = new Date().toISOString();
          void prefSet("lastSyncAt", this.lastSyncAt);
        } else {
          // Increment retry count
          await this.incrementRetry(write.id);
        }
      } catch (err) {
        await this.incrementRetry(write.id);
      }
    }

    this.isSyncing = false;
    this.notifyListeners();
  }

  private async removeWrite(id: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
    });
  }

  private async incrementRetry(id: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const write = getReq.result;
        if (write) {
          write.retries += 1;
          if (write.retries >= 5) {
            write.status = "failed";
          }
          store.put(write);
        }
      };
      tx.oncomplete = () => resolve();
    });
  }

  // Cache data for offline access
  async cacheData(key: string, data: any): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(CACHE_STORE, "readwrite");
      const store = tx.objectStore(CACHE_STORE);
      store.put({ key, data, cachedAt: Date.now() });
      tx.oncomplete = () => resolve();
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(CACHE_STORE, "readonly");
      const store = tx.objectStore(CACHE_STORE);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.cachedAt < 1000 * 60 * 60) { // 1 hour
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    // Send initial status
    this.notifyListeners();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      pendingCount: 0,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
    };
  }
}

export const offlineSync = new OfflineSyncEngine();
export default offlineSync;
