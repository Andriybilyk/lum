import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

class MockIDBDatabase {
  objectStoreNames = {
    contains: vi.fn(() => false),
  };
  transaction = vi.fn();
}

class MockIDBTransaction {
  objectStore = vi.fn();
  oncomplete: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
}

class MockIDBObjectStore {
  put = vi.fn(() => ({
    onerror: null,
    onsuccess: null,
  }));
  add = vi.fn(() => ({
    onerror: null,
    onsuccess: null,
  }));
  delete = vi.fn(() => ({
    onerror: null,
    onsuccess: null,
  }));
  getAll = vi.fn(() => ({
    onerror: null,
    onsuccess: null,
  }));
  clear = vi.fn(() => ({
    onerror: null,
    onsuccess: null,
  }));
}

if (typeof window !== 'undefined') {
  (window as any).indexedDB = {
    open: vi.fn(() => {
      const mockRequest = {
        onerror: null as ((event: Event) => void) | null,
        onsuccess: null as ((event: Event) => void) | null,
        onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
        result: new MockIDBDatabase(),
      };

      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess(new Event('success'));
        }
      }, 0);

      return mockRequest;
    }),
  };
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
