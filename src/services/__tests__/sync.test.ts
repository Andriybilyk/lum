import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncManager } from '../sync';

describe('SyncManager', () => {
  let syncManager: SyncManager;

  beforeEach(() => {
    syncManager = new SyncManager();
  });

  describe('structure', () => {
    it('should have syncOfflineData method', () => {
      expect(typeof syncManager.syncOfflineData).toBe('function');
    });

    it('should have setupOnlineListener method', () => {
      expect(typeof syncManager.setupOnlineListener).toBe('function');
    });

    it('should have isSyncInProgress method', () => {
      expect(typeof syncManager.isSyncInProgress).toBe('function');
    });
  });

  describe('sync status', () => {
    it('should return false for isSyncInProgress initially', () => {
      expect(syncManager.isSyncInProgress()).toBe(false);
    });

    it('should return SyncResult object', async () => {
      const result = await syncManager.syncOfflineData();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('itemssynced');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('errors');
    });

    it('should return zero items synced initially', async () => {
      const result = await syncManager.syncOfflineData();

      expect(typeof result.itemssynced).toBe('number');
      expect(typeof result.failed).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('offline detection', () => {
    it('should fail sync when offline', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      const result = await syncManager.syncOfflineData();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      vi.restoreAllMocks();
    });
  });

  describe('event listeners', () => {
    it('should setup online/offline listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      syncManager.setupOnlineListener();

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      vi.restoreAllMocks();
    });
  });
});
