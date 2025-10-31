import { useState, useEffect, useCallback } from 'react';
import { getDBManager, generateAltarId, isIndexedDBSupported } from '../utils/indexeddb';
import type { SavedAltar, PlacedElement } from '../types';

/**
 * Hook for managing altars in IndexedDB
 */
export function useIndexedDB() {
  const [altars, setAltars] = useState<SavedAltar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => isIndexedDBSupported());

  // Load all altars
  const loadAltars = useCallback(async () => {
    if (!isSupported) {
      setError('IndexedDB no está soportado en este navegador');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const db = getDBManager();
      await db.init();
      const loadedAltars = await db.getAllAltars();
      setAltars(loadedAltars);
    } catch (err) {
      setError('Error al cargar los altares guardados');
      console.error('Failed to load altars:', err);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  // Save altar
  const saveAltar = useCallback(async (
    name: string,
    elements: PlacedElement[],
    thumbnail?: string
  ): Promise<string | null> => {
    if (!isSupported) {
      setError('IndexedDB no está soportado en este navegador');
      return null;
    }

    try {
      const db = getDBManager();
      await db.init();

      const altarId = generateAltarId();
      const now = new Date();

      const altar: SavedAltar = {
        id: altarId,
        name,
        elements,
        createdAt: now,
        updatedAt: now,
        thumbnail: thumbnail || '',
        metadata: {
          score: 0,
          completionLevel: Math.round((elements.length / 20) * 100),
          culturalAuthenticity: 80
        },
        version: '1.0.0'
      };

      await db.saveAltar(altar);

      if (thumbnail) {
        await db.saveThumbnail(altarId, thumbnail);
      }

      await loadAltars();
      return altarId;
    } catch (err) {
      setError('Error al guardar el altar');
      console.error('Failed to save altar:', err);
      return null;
    }
  }, [isSupported, loadAltars]);

  // Update existing altar
  const updateAltar = useCallback(async (
    id: string,
    name: string,
    elements: PlacedElement[],
    thumbnail?: string
  ): Promise<boolean> => {
    if (!isSupported) {
      setError('IndexedDB no está soportado en este navegador');
      return false;
    }

    try {
      const db = getDBManager();
      await db.init();

      const existingAltar = await db.getAltar(id);
      if (!existingAltar) {
        setError('Altar no encontrado');
        return false;
      }

      const updatedAltar: SavedAltar = {
        ...existingAltar,
        name,
        elements,
        updatedAt: new Date(),
        metadata: {
          ...existingAltar.metadata,
          completionLevel: Math.round((elements.length / 20) * 100)
        }
      };

      await db.saveAltar(updatedAltar);

      if (thumbnail) {
        await db.saveThumbnail(id, thumbnail);
      }

      await loadAltars();
      return true;
    } catch (err) {
      setError('Error al actualizar el altar');
      console.error('Failed to update altar:', err);
      return false;
    }
  }, [isSupported, loadAltars]);

  // Delete altar
  const deleteAltar = useCallback(async (id: string): Promise<boolean> => {
    if (!isSupported) {
      setError('IndexedDB no está soportado en este navegador');
      return false;
    }

    try {
      const db = getDBManager();
      await db.init();
      await db.deleteAltar(id);
      await loadAltars();
      return true;
    } catch (err) {
      setError('Error al eliminar el altar');
      console.error('Failed to delete altar:', err);
      return false;
    }
  }, [isSupported, loadAltars]);

  // Get single altar
  const getAltar = useCallback(async (id: string): Promise<SavedAltar | null> => {
    if (!isSupported) {
      setError('IndexedDB no está soportado en este navegador');
      return null;
    }

    try {
      const db = getDBManager();
      await db.init();
      return await db.getAltar(id);
    } catch (err) {
      setError('Error al cargar el altar');
      console.error('Failed to get altar:', err);
      return null;
    }
  }, [isSupported]);

  // Get thumbnail
  const getThumbnail = useCallback(async (altarId: string): Promise<string | null> => {
    if (!isSupported) return null;

    try {
      const db = getDBManager();
      await db.init();
      return await db.getThumbnail(altarId);
    } catch (err) {
      console.error('Failed to get thumbnail:', err);
      return null;
    }
  }, [isSupported]);

  // Get storage estimate
  const getStorageEstimate = useCallback(async () => {
    if (!isSupported) return { usage: 0, quota: 0, percentage: 0 };

    try {
      const db = getDBManager();
      return await db.getStorageEstimate();
    } catch (err) {
      console.error('Failed to get storage estimate:', err);
      return { usage: 0, quota: 0, percentage: 0 };
    }
  }, [isSupported]);

  // Clear all altars
  const clearAll = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('IndexedDB no está soportado en este navegador');
      return false;
    }

    try {
      const db = getDBManager();
      await db.init();
      await db.clearAll();
      await loadAltars();
      return true;
    } catch (err) {
      setError('Error al limpiar la base de datos');
      console.error('Failed to clear database:', err);
      return false;
    }
  }, [isSupported, loadAltars]);

  // Count altars
  const countAltars = useCallback(async (): Promise<number> => {
    if (!isSupported) return 0;

    try {
      const db = getDBManager();
      await db.init();
      return await db.countAltars();
    } catch (err) {
      console.error('Failed to count altars:', err);
      return 0;
    }
  }, [isSupported]);

  // Load altars on mount
  useEffect(() => {
    loadAltars();
  }, [loadAltars]);

  return {
    altars,
    loading,
    error,
    isSupported,
    saveAltar,
    updateAltar,
    deleteAltar,
    getAltar,
    getThumbnail,
    getStorageEstimate,
    clearAll,
    countAltars,
    reload: loadAltars
  };
}

/**
 * Hook for thumbnail generation from canvas
 */
export function useThumbnailGenerator() {
  const generateThumbnail = useCallback(async (
    canvasElement: HTMLCanvasElement,
    width = 400,
    height = 300
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create temporary canvas for resizing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw scaled version
        ctx.drawImage(canvasElement, 0, 0, width, height);

        // Convert to data URL
        const thumbnail = tempCanvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  return { generateThumbnail };
}
