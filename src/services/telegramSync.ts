import { logger } from '@/utils/logger';

export interface TimeEntry {
  date: string;
  hours: number;
  synced: 'synced' | 'pending' | 'error';
  id?: string;
}

export interface TelegramSyncData {
  userId: string;
  entries: TimeEntry[];
  lastSync: string;
}

const STORAGE_PREFIX = 'telegram_hours_';
const SYNC_INTERVAL = 30000;

class TelegramSyncService {
  private syncIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  init(): void {
    logger.info('Telegram Sync Service initialized');
  }

  getUserStorageKey(userId: string): string {
    return `${STORAGE_PREFIX}${userId}`;
  }

  loadUserData(userId: string): TimeEntry[] {
    try {
      const stored = localStorage.getItem(this.getUserStorageKey(userId));
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error loading Telegram user data:', error);
      return [];
    }
  }

  saveUserData(userId: string, entries: TimeEntry[]): void {
    try {
      localStorage.setItem(
        this.getUserStorageKey(userId),
        JSON.stringify(entries)
      );
    } catch (error) {
      logger.error('Error saving Telegram user data:', error);
    }
  }

  addHours(userId: string, hours: number, date?: string): TimeEntry {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const entries = this.loadUserData(userId);

    const existingIndex = entries.findIndex(e => e.date === targetDate);
    let entry: TimeEntry;

    if (existingIndex >= 0) {
      entries[existingIndex].hours += hours;
      entries[existingIndex].synced = 'pending';
      entry = entries[existingIndex];
    } else {
      entry = {
        date: targetDate,
        hours,
        synced: 'pending',
        id: `${targetDate}-${Math.random().toString(36).substr(2, 9)}`,
      };
      entries.push(entry);
    }

    this.saveUserData(userId, entries);
    logger.info('Hours added for Telegram user:', { userId, entry });

    return entry;
  }

  getMonthStats(userId: string, month?: string): { total: number; entries: TimeEntry[] } {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const entries = this.loadUserData(userId);

    const monthEntries = entries.filter(e => e.date.startsWith(targetMonth));
    const total = monthEntries.reduce((sum, e) => sum + e.hours, 0);

    return { total, entries: monthEntries };
  }

  getTodayHours(userId: string): number {
    const today = new Date().toISOString().split('T')[0];
    const entries = this.loadUserData(userId);
    const todayEntry = entries.find(e => e.date === today);

    return todayEntry?.hours || 0;
  }

  getRecentEntries(userId: string, days: number = 7): TimeEntry[] {
    const entries = this.loadUserData(userId);
    return entries.slice(-days).reverse();
  }

  markSynced(userId: string, entryIds: string[]): void {
    const entries = this.loadUserData(userId);

    entries.forEach(entry => {
      if (entryIds.includes(entry.id || '')) {
        entry.synced = 'synced';
      }
    });

    this.saveUserData(userId, entries);
  }

  markSyncFailed(userId: string, entryIds: string[]): void {
    const entries = this.loadUserData(userId);

    entries.forEach(entry => {
      if (entryIds.includes(entry.id || '')) {
        entry.synced = 'error';
      }
    });

    this.saveUserData(userId, entries);
  }

  getPendingSyncEntries(userId: string): TimeEntry[] {
    const entries = this.loadUserData(userId);
    return entries.filter(e => e.synced === 'pending');
  }

  startAutoSync(userId: string, onSync?: () => Promise<void>): void {
    if (this.syncIntervals.has(userId)) {
      clearInterval(this.syncIntervals.get(userId));
    }

    const interval = setInterval(async () => {
      try {
        if (onSync) {
          await onSync();
        }
      } catch (error) {
        logger.error('Auto sync failed for Telegram user:', { userId, error });
      }
    }, SYNC_INTERVAL);

    this.syncIntervals.set(userId, interval);
    logger.info('Auto sync started for Telegram user:', userId);
  }

  stopAutoSync(userId: string): void {
    const interval = this.syncIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(userId);
      logger.info('Auto sync stopped for Telegram user:', userId);
    }
  }

  clearUserData(userId: string): void {
    localStorage.removeItem(this.getUserStorageKey(userId));
    this.stopAutoSync(userId);
    logger.info('Telegram user data cleared:', userId);
  }

  exportForBackup(userId: string): TelegramSyncData {
    return {
      userId,
      entries: this.loadUserData(userId),
      lastSync: new Date().toISOString(),
    };
  }

  importFromBackup(userId: string, data: TelegramSyncData): void {
    if (data.userId === userId) {
      this.saveUserData(userId, data.entries);
      logger.info('Telegram user data imported:', userId);
    } else {
      logger.error('User ID mismatch during import');
    }
  }
}

export const telegramSync = new TelegramSyncService();
