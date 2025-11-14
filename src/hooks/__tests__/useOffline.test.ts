import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOffline } from '../useOffline';

describe('useOffline hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return initial state with online status', () => {
      const { result } = renderHook(() => useOffline());

      expect(result.current).toHaveProperty('isOnline');
      expect(result.current).toHaveProperty('isSyncing');
      expect(result.current).toHaveProperty('syncOfflineData');
      expect(result.current).toHaveProperty('hasPendingSync');
      expect(result.current).toHaveProperty('lastSyncTime');
    });

    it('should initialize isSyncing as false', () => {
      const { result } = renderHook(() => useOffline());

      expect(result.current.isSyncing).toBe(false);
    });

    it('should initialize lastSyncTime as null', () => {
      const { result } = renderHook(() => useOffline());

      expect(result.current.lastSyncTime).toBeNull();
    });
  });

  describe('online status detection', () => {
    it('should detect navigator.onLine status', () => {
      const { result } = renderHook(() => useOffline());

      expect(typeof result.current.isOnline).toBe('boolean');
    });
  });

  describe('sync methods', () => {
    it('should have syncOfflineData method', () => {
      const { result } = renderHook(() => useOffline());

      expect(typeof result.current.syncOfflineData).toBe('function');
    });

    it('should return sync result from syncOfflineData', async () => {
      const { result } = renderHook(() => useOffline());

      const syncResult = await result.current.syncOfflineData();

      expect(syncResult).toHaveProperty('success');
      expect(syncResult).toHaveProperty('itemssynced');
      expect(syncResult).toHaveProperty('failed');
      expect(syncResult).toHaveProperty('errors');
    });
  });

  describe('sync state', () => {
    it('should track hasPendingSync state', () => {
      const { result } = renderHook(() => useOffline());

      expect(typeof result.current.hasPendingSync).toBe('boolean');
    });
  });
});
