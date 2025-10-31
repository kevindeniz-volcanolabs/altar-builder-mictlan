import type { PlacedElement, SavedAltar } from '../types';

const ALTAR_STORAGE_KEY = 'altar-builder-current-altar';
const SAVED_ALTARS_KEY = 'altar-builder-saved-altars';
const AUTO_SAVE_DEBOUNCE_MS = 500;

/**
 * Save current altar state to LocalStorage
 */
export function saveCurrentAltar(elements: PlacedElement[]): boolean {
  try {
    const altarData = {
      elements,
      lastSaved: new Date().toISOString(),
      version: '1.0.0'
    };
    localStorage.setItem(ALTAR_STORAGE_KEY, JSON.stringify(altarData));
    return true;
  } catch (error) {
    console.error('Error saving altar to LocalStorage:', error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      // Handle storage quota exceeded
      handleStorageQuotaExceeded();
    }
    return false;
  }
}

/**
 * Load current altar state from LocalStorage
 */
export function loadCurrentAltar(): PlacedElement[] | null {
  try {
    const data = localStorage.getItem(ALTAR_STORAGE_KEY);
    if (!data) return null;

    const altarData = JSON.parse(data);

    // Validate the data structure
    if (!altarData.elements || !Array.isArray(altarData.elements)) {
      console.warn('Invalid altar data structure');
      return null;
    }

    // Convert date strings back to Date objects
    return altarData.elements.map((el: any) => ({
      ...el,
      placedAt: new Date(el.placedAt)
    }));
  } catch (error) {
    console.error('Error loading altar from LocalStorage:', error);
    return null;
  }
}

/**
 * Clear current altar from LocalStorage
 */
export function clearCurrentAltar(): boolean {
  try {
    localStorage.removeItem(ALTAR_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing altar from LocalStorage:', error);
    return false;
  }
}

/**
 * Create a debounced auto-save function
 */
export function createDebouncedAutoSave(
  callback: (elements: PlacedElement[]) => void,
  delay: number = AUTO_SAVE_DEBOUNCE_MS
): (elements: PlacedElement[]) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (elements: PlacedElement[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(elements);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Save altar to saved altars collection
 */
export function saveAltar(name: string, elements: PlacedElement[]): SavedAltar | null {
  try {
    const savedAltars = getSavedAltars();

    const newAltar: SavedAltar = {
      id: generateUniqueId(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      thumbnail: '', // Will be generated later
      elements,
      metadata: {
        score: 0,
        completionLevel: 0,
        culturalAuthenticity: 0
      },
      version: '1.0.0'
    };

    savedAltars.push(newAltar);
    localStorage.setItem(SAVED_ALTARS_KEY, JSON.stringify(savedAltars));

    return newAltar;
  } catch (error) {
    console.error('Error saving altar:', error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      handleStorageQuotaExceeded();
    }
    return null;
  }
}

/**
 * Get all saved altars
 */
export function getSavedAltars(): SavedAltar[] {
  try {
    const data = localStorage.getItem(SAVED_ALTARS_KEY);
    if (!data) return [];

    const altars = JSON.parse(data);

    // Convert date strings back to Date objects
    return altars.map((altar: any) => ({
      ...altar,
      createdAt: new Date(altar.createdAt),
      updatedAt: new Date(altar.updatedAt),
      elements: altar.elements.map((el: any) => ({
        ...el,
        placedAt: new Date(el.placedAt)
      }))
    }));
  } catch (error) {
    console.error('Error loading saved altars:', error);
    return [];
  }
}

/**
 * Delete a saved altar
 */
export function deleteSavedAltar(altarId: string): boolean {
  try {
    const savedAltars = getSavedAltars();
    const filteredAltars = savedAltars.filter(altar => altar.id !== altarId);
    localStorage.setItem(SAVED_ALTARS_KEY, JSON.stringify(filteredAltars));
    return true;
  } catch (error) {
    console.error('Error deleting altar:', error);
    return false;
  }
}

/**
 * Load a specific saved altar
 */
export function loadSavedAltar(altarId: string): SavedAltar | null {
  const savedAltars = getSavedAltars();
  return savedAltars.find(altar => altar.id === altarId) || null;
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): { used: number; available: number; percentage: number } {
  try {
    let used = 0;

    // Calculate used storage
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Most browsers have a 5-10MB limit for localStorage
    // We'll use 5MB as a conservative estimate
    const available = 5 * 1024 * 1024; // 5MB in bytes
    const percentage = (used / available) * 100;

    return {
      used,
      available,
      percentage: Math.round(percentage)
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Check if storage is nearly full
 */
export function isStorageNearlyFull(): boolean {
  const { percentage } = getStorageInfo();
  return percentage > 80;
}

/**
 * Handle storage quota exceeded error
 */
function handleStorageQuotaExceeded(): void {
  console.warn('LocalStorage quota exceeded');

  // Try to free up space by removing oldest saved altars
  const savedAltars = getSavedAltars();
  if (savedAltars.length > 0) {
    // Sort by creation date and remove oldest
    savedAltars.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const oldestAltar = savedAltars[0];
    deleteSavedAltar(oldestAltar.id);

    alert(`Storage full. Removed oldest altar: "${oldestAltar.name}"`);
  }
}

/**
 * Generate a unique ID for altars
 */
function generateUniqueId(): string {
  return `altar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export altar data as JSON
 */
export function exportAltarAsJSON(altar: SavedAltar): void {
  try {
    const dataStr = JSON.stringify(altar, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${altar.name.replace(/\s+/g, '-')}-${altar.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting altar:', error);
  }
}

/**
 * Import altar data from JSON
 */
export async function importAltarFromJSON(file: File): Promise<SavedAltar | null> {
  try {
    const text = await file.text();
    const altar = JSON.parse(text);

    // Validate the structure
    if (!altar.id || !altar.name || !altar.elements) {
      throw new Error('Invalid altar data structure');
    }

    // Generate new ID to avoid conflicts
    altar.id = generateUniqueId();
    altar.updatedAt = new Date();

    // Convert date strings to Date objects
    altar.createdAt = new Date(altar.createdAt);
    altar.elements = altar.elements.map((el: any) => ({
      ...el,
      placedAt: new Date(el.placedAt)
    }));

    // Save to collection
    const savedAltars = getSavedAltars();
    savedAltars.push(altar);
    localStorage.setItem(SAVED_ALTARS_KEY, JSON.stringify(savedAltars));

    return altar;
  } catch (error) {
    console.error('Error importing altar:', error);
    return null;
  }
}

/**
 * Clear all storage data
 */
export function clearAllStorage(): boolean {
  try {
    localStorage.removeItem(ALTAR_STORAGE_KEY);
    localStorage.removeItem(SAVED_ALTARS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}
