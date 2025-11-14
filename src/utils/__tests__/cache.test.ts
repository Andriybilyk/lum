import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheManager } from '../cache';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  describe('basic operations', () => {
    it('should set and get value', () => {
      cache.set('key1', 'value1');
      const value = cache.get<string>('key1');

      expect(value).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      const value = cache.get('nonexistent');

      expect(value).toBeNull();
    });

    it('should delete value from cache', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');

      const value = cache.get('key1');
      expect(value).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('TTL functionality', () => {
    it('should respect custom TTL', () => {
      const ttl = 1000;
      cache.set('key1', 'value1', ttl);

      expect(cache.get('key1')).toBe('value1');

      vi.advanceTimersByTime(ttl + 1);

      expect(cache.get('key1')).toBeNull();
    });

    it('should use default TTL if not specified', () => {
      cache.set('key1', 'value1');
      const stats = cache.getStats();

      expect(stats.size).toBe(1);
    });

    it('should automatically remove expired entries', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 5000);

      vi.advanceTimersByTime(1001);

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('cache management', () => {
    it('should return cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.size()).toBe(2);
    });

    it('should clear entire cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
    });

    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should cleanup expired entries', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 5000);

      vi.advanceTimersByTime(1001);

      const cleanedCount = cache.cleanup();

      expect(cleanedCount).toBe(1);
      expect(cache.size()).toBe(1);
    });
  });

  describe('data types', () => {
    it('should handle different data types', () => {
      const obj = { name: 'John', age: 30 };
      const arr = [1, 2, 3, 4, 5];

      cache.set('obj', obj);
      cache.set('arr', arr);

      expect(cache.get<typeof obj>('obj')).toEqual(obj);
      expect(cache.get<typeof arr>('arr')).toEqual(arr);
    });

    it('should handle null values', () => {
      cache.set('nullKey', null);

      expect(cache.has('nullKey')).toBe(true);
      expect(cache.get('nullKey')).toBeNull();
    });
  });
});
