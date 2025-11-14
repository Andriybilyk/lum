import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';

interface TestItem {
  id: string;
  name: string;
  email: string;
  level: string;
}

describe('useSearch hook', () => {
  const testItems: TestItem[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', level: 'Senior' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', level: 'Junior' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', level: 'Senior' },
    { id: '4', name: 'Alice Williams', email: 'alice@example.com', level: 'Mid-level' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic search', () => {
    it('should initialize with all items and empty search term', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name', 'email'] })
      );

      expect(result.current.searchTerm).toBe('');
      expect(result.current.results).toEqual(testItems);
      expect(result.current.totalResults).toBe(4);
    });

    it('should filter items by name', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'] })
      );

      act(() => {
        result.current.handleSearch('John');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results[0].name).toContain('John');
    });

    it('should filter items by email', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['email'] })
      );

      act(() => {
        result.current.handleSearch('jane');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].name).toBe('Jane Smith');
    });

    it('should search multiple fields', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name', 'level'] })
      );

      act(() => {
        result.current.handleSearch('Senior');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results.every(r => r.level === 'Senior')).toBe(true);
    });

    it('should return empty results for no matches', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'] })
      );

      act(() => {
        result.current.handleSearch('NotExist');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(0);
      expect(result.current.totalResults).toBe(0);
    });

    it('should clear search results', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'] })
      );

      act(() => {
        result.current.handleSearch('John');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(2);

      act(() => {
        result.current.clear();
      });

      expect(result.current.searchTerm).toBe('');
      expect(result.current.results).toEqual(testItems);
    });
  });

  describe('match types', () => {
    it('should support includes matching (default)', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'], matchType: 'includes' })
      );

      act(() => {
        result.current.handleSearch('john');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(2);
    });

    it('should support startsWith matching', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'], matchType: 'startsWith' })
      );

      act(() => {
        result.current.handleSearch('john');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].name).toBe('John Doe');
    });

    it('should support exact matching', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'], matchType: 'exact' })
      );

      act(() => {
        result.current.handleSearch('John Doe');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].name).toBe('John Doe');
    });

    it('should not match with exact when case is different', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'], matchType: 'exact', caseSensitive: true })
      );

      act(() => {
        result.current.handleSearch('john doe');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(0);
    });
  });

  describe('case sensitivity', () => {
    it('should be case insensitive by default', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'], caseSensitive: false })
      );

      act(() => {
        result.current.handleSearch('JOHN');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(2);
    });

    it('should be case sensitive when specified', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'], caseSensitive: true })
      );

      act(() => {
        result.current.handleSearch('JOHN');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(0);
    });

    it('should match exact case when case sensitive', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'], caseSensitive: true })
      );

      act(() => {
        result.current.handleSearch('John');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(2);
    });
  });

  describe('debouncing', () => {
    it('should have isSearching flag', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'], debounce: 300 })
      );

      expect(result.current.isSearching).toBe(false);

      act(() => {
        result.current.handleSearch('John');
      });

      expect(result.current.isSearching).toBe(true);

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      const { result } = renderHook(() =>
        useSearch([], { fields: ['name'] })
      );

      expect(result.current.results).toEqual([]);
      expect(result.current.totalResults).toBe(0);
    });

    it('should handle whitespace in search', () => {
      const { result } = renderHook(() =>
        useSearch(testItems, { fields: ['name'] })
      );

      act(() => {
        result.current.handleSearch('   ');
        vi.runAllTimers();
      });

      expect(result.current.results).toEqual(testItems);
    });

    it('should handle null and undefined fields', () => {
      const itemsWithNull = [
        { id: '1', name: 'John', email: null, level: 'Senior' },
        { id: '2', name: 'Jane', email: 'jane@example.com', level: undefined },
      ];

      const { result } = renderHook(() =>
        useSearch(itemsWithNull as any, { fields: ['name', 'email', 'level'] })
      );

      act(() => {
        result.current.handleSearch('Jane');
        vi.runAllTimers();
      });

      expect(result.current.results.length).toBeGreaterThan(0);
    });

    it('should handle special characters in search', () => {
      const specialItems = [
        { id: '1', name: 'Test@123', email: 'test@example.com', level: 'Senior' },
      ];

      const { result } = renderHook(() =>
        useSearch(specialItems, { fields: ['name'] })
      );

      act(() => {
        result.current.handleSearch('@');
        vi.runAllTimers();
      });

      expect(result.current.results).toHaveLength(1);
    });
  });

  describe('performance', () => {
    it('should handle large datasets', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        level: i % 2 === 0 ? 'Senior' : 'Junior',
      }));

      const { result } = renderHook(() =>
        useSearch(largeDataset, { fields: ['name'] })
      );

      act(() => {
        result.current.handleSearch('User 500');
        vi.runAllTimers();
      });

      expect(result.current.results.length).toBeGreaterThan(0);
    });
  });
});
