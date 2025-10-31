import { useEffect, useRef, useCallback, useState } from 'react';
import { useAltarStore, usePlacedElements } from '../store/useAltarStore';
import { useIndexedDB } from './useIndexedDB';
import type { PlacedElement, SavedAltar } from '../types';
import {
  saveCurrentAltar,
  loadCurrentAltar,
  clearCurrentAltar,
  saveAltar as savePersistentAltar,
  getSavedAltars,
  deleteSavedAltar,
  createDebouncedAutoSave,
  getStorageInfo,
  isStorageNearlyFull
} from '../utils/persistence';

/**
 * Persistence status
 */
export interface PersistenceStatus {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  error: string | null;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  localStorageUsed: number;
  localStorageAvailable: number;
  indexedDBUsed: number;
  indexedDBAvailable: number;
  totalAltars: number;
}

/**
 * Enhanced hook for managing altar persistence
 * Integrates LocalStorage and IndexedDB with comprehensive state tracking
 */
export function usePersistence() {
  const store = useAltarStore();
  const placedElements = usePlacedElements();
  const indexedDB = useIndexedDB();
  const debouncedSaveRef = useRef<((elements: typeof placedElements) => void) | null>(null);

  const [status, setStatus] = useState<PersistenceStatus>({
    isAutoSaving: false,
    lastSaved: null,
    isDirty: false,
    error: null
  });

  // Initialize debounced save function
  useEffect(() => {
    debouncedSaveRef.current = createDebouncedAutoSave((elements) => {
      try {
        setStatus(prev => ({ ...prev, isAutoSaving: true, error: null }));
        const success = saveCurrentAltar(elements);
        if (success) {
          setStatus(prev => ({
            ...prev,
            isAutoSaving: false,
            lastSaved: new Date(),
            isDirty: false
          }));
        } else {
          setStatus(prev => ({
            ...prev,
            isAutoSaving: false,
            error: 'Error al guardar'
          }));
        }
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          isAutoSaving: false,
          error: 'Error al guardar en LocalStorage'
        }));
      }
    });
  }, []);

  // Auto-save when placed elements change
  useEffect(() => {
    if (debouncedSaveRef.current && placedElements.length > 0) {
      setStatus(prev => ({ ...prev, isDirty: true }));
      debouncedSaveRef.current(placedElements);
    }
  }, [placedElements]);

  // Load saved altar on mount
  useEffect(() => {
    const restoreAltar = useAltarStore.getState().restoreAltar;
    const savedAltar = loadCurrentAltar();
    if (savedAltar && savedAltar.length > 0) {
      restoreAltar(savedAltar);
      console.log('Restored altar with', savedAltar.length, 'elements');
    }
  }, []);

  // Save to IndexedDB
  const saveToIndexedDB = useCallback(async (name: string, thumbnail?: string): Promise<string> => {
    try {
      setStatus(prev => ({ ...prev, isAutoSaving: true, error: null }));
      const altarId = await indexedDB.saveAltar(name, placedElements, thumbnail);
      setStatus(prev => ({
        ...prev,
        isAutoSaving: false,
        lastSaved: new Date(),
        error: null
      }));
      return altarId;
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isAutoSaving: false,
        error: 'Error al guardar en IndexedDB'
      }));
      throw error;
    }
  }, [indexedDB, placedElements]);

  // Load from IndexedDB
  const loadFromIndexedDB = useCallback(async (id: string): Promise<void> => {
    try {
      const altar = await indexedDB.getAltar(id);
      if (altar) {
        store.restoreAltar(altar.elements);
        setStatus(prev => ({
          ...prev,
          lastSaved: new Date(altar.updatedAt),
          isDirty: false,
          error: null
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: 'Error al cargar desde IndexedDB'
      }));
      throw error;
    }
  }, [indexedDB, store]);

  // Load from LocalStorage
  const loadFromLocalStorage = useCallback((): boolean => {
    try {
      const savedAltar = loadCurrentAltar();
      if (savedAltar && savedAltar.length > 0) {
        store.restoreAltar(savedAltar);
        setStatus(prev => ({
          ...prev,
          isDirty: false,
          error: null
        }));
        return true;
      }
      return false;
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: 'Error al cargar desde LocalStorage'
      }));
      return false;
    }
  }, [store]);

  // Clear current altar
  const clearCurrent = useCallback((): void => {
    store.clearAltar();
    clearCurrentAltar();
    setStatus({
      isAutoSaving: false,
      lastSaved: null,
      isDirty: false,
      error: null
    });
  }, [store]);

  // Export as JSON
  const exportAsJSON = useCallback((name: string = 'mi-altar'): void => {
    const data = {
      version: '1.0.0',
      name,
      createdAt: new Date().toISOString(),
      elements: placedElements
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [placedElements]);

  // Import from JSON
  const importFromJSON = useCallback(async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.elements || !Array.isArray(data.elements)) {
        throw new Error('Formato de archivo inválido');
      }

      store.restoreAltar(data.elements);
      setStatus(prev => ({
        ...prev,
        isDirty: false,
        error: null
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: 'Error al importar archivo JSON'
      }));
      throw error;
    }
  }, [store]);

  // Get storage stats
  const getStorageStats = useCallback(async (): Promise<StorageStats> => {
    const localStorageUsed = new Blob([localStorage.getItem('altar-current') || '']).size;
    const localStorageAvailable = 5 * 1024 * 1024;

    let indexedDBUsed = 0;
    let indexedDBAvailable = 0;
    let totalAltars = 0;

    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        indexedDBUsed = estimate.usage || 0;
        indexedDBAvailable = estimate.quota || 0;
      }

      // Get altars count from the hook's state
      totalAltars = indexedDB.altars.length;
    } catch (error) {
      console.error('Error getting storage stats:', error);
    }

    return {
      localStorageUsed,
      localStorageAvailable,
      indexedDBUsed,
      indexedDBAvailable,
      totalAltars
    };
  }, [indexedDB]);

  // Force save
  const forceSave = useCallback((): void => {
    if (placedElements.length > 0) {
      try {
        const success = saveCurrentAltar(placedElements);
        if (success) {
          setStatus(prev => ({
            ...prev,
            lastSaved: new Date(),
            isDirty: false,
            error: null
          }));
        }
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          error: 'Error al guardar'
        }));
      }
    }
  }, [placedElements]);

  return {
    // Status
    status,
    hasUnsavedChanges: status.isDirty,

    // LocalStorage operations
    saveCurrentAltar: () => saveCurrentAltar(placedElements),
    loadFromLocalStorage,
    clearCurrentAltar: clearCurrent,
    forceSave,

    // IndexedDB operations
    saveToIndexedDB,
    loadFromIndexedDB,

    // Import/Export
    exportAsJSON,
    importFromJSON,

    // Statistics
    getStorageInfo,
    isStorageNearlyFull,
    getStorageStats,

    // Legacy API
    getSavedAltars,
    deleteSavedAltar
  };
}

/**
 * Hook for saving named altars
 */
export function useSaveAltar() {
  const placedElements = useAltarStore(state => state.grid.placedElements);
  const incrementAltarCount = useAltarStore(state => state.incrementAltarCount);

  const saveAltar = useCallback((name: string) => {
    if (placedElements.length === 0) {
      alert('No hay elementos en el altar para guardar');
      return null;
    }

    const savedAltar = savePersistentAltar(name, placedElements);

    if (savedAltar) {
      incrementAltarCount();
      console.log('Altar saved:', savedAltar.name);
      return savedAltar;
    }

    return null;
  }, [placedElements, incrementAltarCount]);

  return { saveAltar };
}

/**
 * Hook for managing storage warnings
 */
export function useStorageWarnings() {
  useEffect(() => {
    const checkStorage = () => {
      if (isStorageNearlyFull()) {
        const { percentage } = getStorageInfo();
        console.warn(`Storage is ${percentage}% full`);

        // Show warning to user
        if (percentage > 90) {
          alert(
            'El almacenamiento está casi lleno. Considera exportar tus altares y eliminar los antiguos.'
          );
        }
      }
    };

    // Check on mount
    checkStorage();

    // Check periodically
    const intervalId = setInterval(checkStorage, 60000); // Every minute

    return () => clearInterval(intervalId);
  }, []);
}

/**
 * Hook for altar backup and recovery
 */
export function useBackupRecovery() {
  const placedElements = usePlacedElements();
  const { exportAsJSON, importFromJSON } = usePersistence();

  const [backupHistory, setBackupHistory] = useState<Array<{
    timestamp: Date;
    elementCount: number;
    data: PlacedElement[];
  }>>([]);

  // Create backup snapshot
  const createBackup = useCallback((): void => {
    const backup = {
      timestamp: new Date(),
      elementCount: placedElements.length,
      data: [...placedElements]
    };

    setBackupHistory(prev => {
      const newHistory = [backup, ...prev].slice(0, 10); // Keep last 10 backups
      return newHistory;
    });
  }, [placedElements]);

  // Restore from backup
  const restoreBackup = useCallback((index: number): boolean => {
    if (index >= 0 && index < backupHistory.length) {
      const backup = backupHistory[index];
      const store = useAltarStore.getState();
      store.restoreAltar(backup.data);
      return true;
    }
    return false;
  }, [backupHistory]);

  // Clear backup history
  const clearBackups = useCallback((): void => {
    setBackupHistory([]);
  }, []);

  // Auto-backup every 5 minutes
  useEffect(() => {
    if (placedElements.length > 0) {
      const timer = setInterval(createBackup, 5 * 60 * 1000);
      return () => clearInterval(timer);
    }
  }, [placedElements.length, createBackup]);

  return {
    backupHistory,
    createBackup,
    restoreBackup,
    clearBackups,
    exportAsJSON,
    importFromJSON
  };
}

/**
 * Hook for data migration between storage systems
 */
export function useDataMigration() {
  const { loadFromLocalStorage, saveToIndexedDB } = usePersistence();
  const placedElements = usePlacedElements();

  // Migrate current LocalStorage data to IndexedDB
  const migrateToIndexedDB = useCallback(async (name: string): Promise<boolean> => {
    try {
      // Load from LocalStorage if not already loaded
      if (placedElements.length === 0) {
        const loaded = loadFromLocalStorage();
        if (!loaded) {
          return false;
        }
      }

      // Save to IndexedDB
      await saveToIndexedDB(name);
      return true;
    } catch (error) {
      console.error('Migration error:', error);
      return false;
    }
  }, [placedElements, loadFromLocalStorage, saveToIndexedDB]);

  // Check if migration is needed
  const needsMigration = useCallback((): boolean => {
    const hasLocalStorage = localStorage.getItem('altar-current') !== null;
    return hasLocalStorage;
  }, []);

  return {
    migrateToIndexedDB,
    needsMigration
  };
}
