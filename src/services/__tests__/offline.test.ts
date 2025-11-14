import { describe, it, expect } from 'vitest';
import { OfflineManager } from '../offline';

describe('OfflineManager', () => {
  describe('online detection', () => {
    it('should have isOnline method', () => {
      const manager = new OfflineManager();
      expect(typeof manager.isOnline).toBe('function');
    });

    it('should return boolean for online status', () => {
      const manager = new OfflineManager();
      const result = manager.isOnline();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('basic structure', () => {
    it('should have init method', () => {
      const manager = new OfflineManager();
      expect(typeof manager.init).toBe('function');
    });

    it('should have saveHours method', () => {
      const manager = new OfflineManager();
      expect(typeof manager.saveHours).toBe('function');
    });

    it('should have saveProcess method', () => {
      const manager = new OfflineManager();
      expect(typeof manager.saveProcess).toBe('function');
    });

    it('should have sync queue methods', () => {
      const manager = new OfflineManager();
      expect(typeof manager.addToSyncQueue).toBe('function');
      expect(typeof manager.getSyncQueue).toBe('function');
      expect(typeof manager.removeSyncQueueItem).toBe('function');
    });

    it('should have data retrieval methods', () => {
      const manager = new OfflineManager();
      expect(typeof manager.getAllHours).toBe('function');
      expect(typeof manager.getAllProcesses).toBe('function');
    });

    it('should have clearOfflineData method', () => {
      const manager = new OfflineManager();
      expect(typeof manager.clearOfflineData).toBe('function');
    });
  });
});
