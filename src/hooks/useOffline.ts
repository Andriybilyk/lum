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
      logger.info('✅ Connection restored, syncing offline data');
      setIsOnline(true);
      await syncOfflineData();
    };

    const handleOffline = () => {
      logger.info('❌ Connection lost');
      setIsOnline(false);
      setHasPendingSync(true);
    };

    const checkConnection = () => {
      // Для Telegram Mini App: навіть якщо navigator.onLine = false,
      // ми припускаємо що користувач онлайн, доки не отримаємо 'offline' подію
      const isCurrentlyOnline = navigator.onLine;

      // Логування для debug
      logger.info('🔍 Checking connection status');
      logger.info('🔍 navigator.onLine:', isCurrentlyOnline);

      // Встановлюємо true за замовчуванням для Telegram Mini App
      // (навіть якщо navigator.onLine говорить false)
      setIsOnline(true);
      logger.info('✅ Setting isOnline to TRUE (default for Telegram Mini App)');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Перевіряємо стан при завантаженні
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
