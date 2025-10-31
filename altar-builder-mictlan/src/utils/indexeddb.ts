import type { SavedAltar, PlacedElement } from '../types';

const DB_NAME = 'altar-builder-db';
const DB_VERSION = 1;
const ALTARS_STORE = 'altars';
const THUMBNAILS_STORE = 'thumbnails';

/**
 * IndexedDB Database Manager
 */
class IndexedDBManager {
  private db: IDBDatabase | null = null;

  /**
   * Initialize and open the database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create altars store
        if (!db.objectStoreNames.contains(ALTARS_STORE)) {
          const altarsStore = db.createObjectStore(ALTARS_STORE, { keyPath: 'id' });
          altarsStore.createIndex('createdAt', 'createdAt', { unique: false });
          altarsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          altarsStore.createIndex('name', 'name', { unique: false });
        }

        // Create thumbnails store
        if (!db.objectStoreNames.contains(THUMBNAILS_STORE)) {
          db.createObjectStore(THUMBNAILS_STORE, { keyPath: 'altarId' });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Save an altar to IndexedDB
   */
  async saveAltar(altar: SavedAltar): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ALTARS_STORE], 'readwrite');
      const store = transaction.objectStore(ALTARS_STORE);
      const request = store.put(altar);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save altar'));
    });
  }

  /**
   * Get an altar by ID
   */
  async getAltar(id: string): Promise<SavedAltar | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ALTARS_STORE], 'readonly');
      const store = transaction.objectStore(ALTARS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const altar = request.result;
        if (altar) {
          // Convert date strings back to Date objects
          altar.createdAt = new Date(altar.createdAt);
          altar.updatedAt = new Date(altar.updatedAt);
          altar.elements = altar.elements.map((el: any) => ({
            ...el,
            placedAt: new Date(el.placedAt)
          }));
        }
        resolve(altar || null);
      };
      request.onerror = () => reject(new Error('Failed to get altar'));
    });
  }

  /**
   * Get all altars
   */
  async getAllAltars(): Promise<SavedAltar[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ALTARS_STORE], 'readonly');
      const store = transaction.objectStore(ALTARS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const altars = request.result.map((altar: any) => ({
          ...altar,
          createdAt: new Date(altar.createdAt),
          updatedAt: new Date(altar.updatedAt),
          elements: altar.elements.map((el: any) => ({
            ...el,
            placedAt: new Date(el.placedAt)
          }))
        }));
        // Sort by most recent first
        altars.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        resolve(altars);
      };
      request.onerror = () => reject(new Error('Failed to get altars'));
    });
  }

  /**
   * Delete an altar
   */
  async deleteAltar(id: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ALTARS_STORE, THUMBNAILS_STORE], 'readwrite');

      // Delete altar
      const altarsStore = transaction.objectStore(ALTARS_STORE);
      const altarRequest = altarsStore.delete(id);

      // Delete thumbnail
      const thumbnailsStore = transaction.objectStore(THUMBNAILS_STORE);
      thumbnailsStore.delete(id);

      altarRequest.onsuccess = () => resolve();
      altarRequest.onerror = () => reject(new Error('Failed to delete altar'));
    });
  }

  /**
   * Save altar thumbnail
   */
  async saveThumbnail(altarId: string, thumbnail: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([THUMBNAILS_STORE], 'readwrite');
      const store = transaction.objectStore(THUMBNAILS_STORE);
      const request = store.put({ altarId, thumbnail });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save thumbnail'));
    });
  }

  /**
   * Get altar thumbnail
   */
  async getThumbnail(altarId: string): Promise<string | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([THUMBNAILS_STORE], 'readonly');
      const store = transaction.objectStore(THUMBNAILS_STORE);
      const request = store.get(altarId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.thumbnail : null);
      };
      request.onerror = () => reject(new Error('Failed to get thumbnail'));
    });
  }

  /**
   * Get database size estimate
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      return { usage, quota, percentage };
    }
    return { usage: 0, quota: 0, percentage: 0 };
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ALTARS_STORE, THUMBNAILS_STORE], 'readwrite');

      const altarsStore = transaction.objectStore(ALTARS_STORE);
      const thumbnailsStore = transaction.objectStore(THUMBNAILS_STORE);

      altarsStore.clear();
      thumbnailsStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear database'));
    });
  }

  /**
   * Count altars in database
   */
  async countAltars(): Promise<number> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ALTARS_STORE], 'readonly');
      const store = transaction.objectStore(ALTARS_STORE);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to count altars'));
    });
  }
}

// Singleton instance
let dbManager: IndexedDBManager | null = null;

/**
 * Get IndexedDB manager instance
 */
export function getDBManager(): IndexedDBManager {
  if (!dbManager) {
    dbManager = new IndexedDBManager();
  }
  return dbManager;
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return 'indexedDB' in window;
}

/**
 * Generate unique ID for altars
 */
export function generateAltarId(): string {
  return `altar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
