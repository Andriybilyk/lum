import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { telegramSync } from '../telegramSync';

describe('TelegramSyncService', () => {
  const testUserId = 'test_user_123';
  const testDate = '2024-11-14';

  beforeEach(() => {
    localStorage.clear();
    telegramSync.init();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Storage Management', () => {
    it('should generate correct storage key', () => {
      const key = telegramSync.getUserStorageKey(testUserId);
      expect(key).toBe(`telegram_hours_${testUserId}`);
    });

    it('should save and load user data', () => {
      const entries = [
        { date: testDate, hours: 8, synced: 'synced' as const, id: '1' },
      ];

      telegramSync.saveUserData(testUserId, entries);
      const loaded = telegramSync.loadUserData(testUserId);

      expect(loaded).toEqual(entries);
    });

    it('should return empty array for non-existent user', () => {
      const data = telegramSync.loadUserData('non_existent');
      expect(data).toEqual([]);
    });
  });

  describe('Hour Management', () => {
    it('should add hours to a new date', () => {
      const entry = telegramSync.addHours(testUserId, 4, testDate);

      expect(entry.date).toBe(testDate);
      expect(entry.hours).toBe(4);
      expect(entry.synced).toBe('pending');
      expect(entry.id).toBeDefined();
    });

    it('should accumulate hours on same date', () => {
      telegramSync.addHours(testUserId, 4, testDate);
      telegramSync.addHours(testUserId, 2, testDate);

      const entries = telegramSync.loadUserData(testUserId);
      const entry = entries.find(e => e.date === testDate);

      expect(entry?.hours).toBe(6);
    });

    it('should add hours for today if no date provided', () => {
      const today = new Date().toISOString().split('T')[0];
      const entry = telegramSync.addHours(testUserId, 8);

      expect(entry.date).toBe(today);
      expect(entry.hours).toBe(8);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      const currentDate = new Date();
      const month = currentDate.toISOString().slice(0, 7);

      telegramSync.addHours(testUserId, 8, `${month}-01`);
      telegramSync.addHours(testUserId, 6, `${month}-02`);
      telegramSync.addHours(testUserId, 4, `${month}-03`);

      telegramSync.addHours(testUserId, 10, '2024-10-01');
    });

    it('should calculate month stats correctly', () => {
      const month = new Date().toISOString().slice(0, 7);
      const { total, entries } = telegramSync.getMonthStats(testUserId, month);

      expect(total).toBe(18);
      expect(entries).toHaveLength(3);
    });

    it('should get today hours', () => {
      const today = new Date().toISOString().split('T')[0];
      telegramSync.addHours(testUserId, 8, today);

      const hours = telegramSync.getTodayHours(testUserId);
      expect(hours).toBe(8);
    });

    it('should get recent entries in reverse chronological order', () => {
      const recent = telegramSync.getRecentEntries(testUserId, 7);

      expect(recent.length).toBeGreaterThan(0);
      expect(recent.length).toBeLessThanOrEqual(7);
      expect(recent[0].date <= recent[recent.length - 1].date).toBe(true);
    });
  });

  describe('Sync Management', () => {
    it('should identify pending sync entries', () => {
      telegramSync.addHours(testUserId, 4, testDate);
      telegramSync.addHours(testUserId, 2, '2024-11-13');

      const pending = telegramSync.getPendingSyncEntries(testUserId);

      expect(pending).toHaveLength(2);
      expect(pending.every(e => e.synced === 'pending')).toBe(true);
    });

    it('should mark entries as synced', () => {
      const entry1 = telegramSync.addHours(testUserId, 4, testDate);
      const entry2 = telegramSync.addHours(testUserId, 2, '2024-11-13');

      telegramSync.markSynced(testUserId, [entry1.id || '', entry2.id || '']);

      const entries = telegramSync.loadUserData(testUserId);
      expect(entries.every(e => e.synced === 'synced')).toBe(true);
    });

    it('should mark entries as failed', () => {
      const entry = telegramSync.addHours(testUserId, 4, testDate);

      telegramSync.markSyncFailed(testUserId, [entry.id || '']);

      const entries = telegramSync.loadUserData(testUserId);
      expect(entries[0].synced).toBe('error');
    });
  });

  describe('Auto-sync', () => {
    it('should start and stop auto-sync', () => {
      const callback = vi.fn().mockResolvedValue(undefined);

      telegramSync.startAutoSync(testUserId, callback);
      expect(callback).not.toHaveBeenCalled();

      telegramSync.stopAutoSync(testUserId);
    });
  });

  describe('Data Export', () => {
    it('should export data for backup', () => {
      telegramSync.addHours(testUserId, 8, testDate);

      const backup = telegramSync.exportForBackup(testUserId);

      expect(backup.userId).toBe(testUserId);
      expect(backup.entries).toHaveLength(1);
      expect(backup.lastSync).toBeDefined();
    });

    it('should import data from backup', () => {
      telegramSync.addHours(testUserId, 8, testDate);
      const backup = telegramSync.exportForBackup(testUserId);

      const newUserId = 'new_user_456';
      telegramSync.importFromBackup(newUserId, { ...backup, userId: newUserId });

      const imported = telegramSync.loadUserData(newUserId);
      expect(imported).toEqual(backup.entries);
    });
  });

  describe('Data Clearing', () => {
    it('should clear all user data', () => {
      telegramSync.addHours(testUserId, 8, testDate);
      expect(telegramSync.loadUserData(testUserId)).toHaveLength(1);

      telegramSync.clearUserData(testUserId);

      expect(telegramSync.loadUserData(testUserId)).toHaveLength(0);
    });
  });
});
