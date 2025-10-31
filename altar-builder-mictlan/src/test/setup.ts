import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => {
    return localStorageMock[key] || null
  },
  setItem: (key: string, value: string) => {
    localStorageMock[key] = value
  },
  removeItem: (key: string) => {
    delete localStorageMock[key]
  },
  clear: () => {
    Object.keys(localStorageMock).forEach(key => {
      if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
        delete localStorageMock[key]
      }
    })
  }
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock IndexedDB
const indexedDBMock = {
  open: () => ({
    result: {
      createObjectStore: () => {},
      transaction: () => ({
        objectStore: () => ({
          add: () => ({ onsuccess: null, onerror: null }),
          get: () => ({ onsuccess: null, onerror: null }),
          put: () => ({ onsuccess: null, onerror: null }),
          delete: () => ({ onsuccess: null, onerror: null }),
        })
      })
    },
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null
  })
}

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock
})