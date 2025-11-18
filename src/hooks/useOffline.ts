import { useState, useEffect, useCallback } from 'react';
import { offlineManager } from '@/services/offline';
import { syncManager, type SyncResult } from '@/services/sync';
import { logger } from '@/utils/logger';

interface UseOfflineResult {
  isOnline: boolean;
  isSyncing: boolean;
  syncOfflineData: () => Promise<SyncResult>;
  hasPendingSync: boolean;
  lastSyncTime: number | null;
}

export const useOffline = (): UseOfflineResult => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const syncOfflineData = useCallback(async (): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const result = await syncManager.syncOfflineData();
      setHasPendingSync(false);
      setLastSyncTime(Date.now());
      return result;
    } catch (error) {
      logger.error('Sync failed', error);
      return {
        success: false,
        itemsSynced: 0,
        failed: 0,
        errors: [(error as Error).message],
      };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      logger.info('Connection restored, syncing offline data');
      setIsOnline(true);
      await syncOfflineData();
    };

    const handleOffline = () => {
      logger.info('Connection lost');
      setIsOnline(false);
      setHasPendingSync(true);
    };

    const checkConnection = () => {
      setIsOnline(navigator.onLine);
      logger.info('Current online status:', navigator.onLine);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

  useEffect(() => {
    const checkPendingSync = async () => {
      try {
        const queue = await offlineManager.getSyncQueue();
        setHasPendingSync(queue.length > 0);
      } catch (error) {
        logger.warn('Failed to check pending sync', error);
      }
    };

    checkPendingSync();
  }, []);

  return {
    isOnline,
    isSyncing,
    syncOfflineData,
    hasPendingSync,
    lastSyncTime,
  };
};
