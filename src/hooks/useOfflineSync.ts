import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

export interface QueuedAction {
  id: string;
  type: 'hours' | 'process' | 'material' | 'photo' | 'assignment' | 'additional_work';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = 'offline-sync-queue';
const MAX_RETRIES = 3;

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Завантажити чергу з localStorage при монтуванні
  useEffect(() => {
    const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue);
        setQueue(parsedQueue);
        logger.info(`📥 Loaded ${parsedQueue.length} queued actions from storage`, 'OfflineSync');
      } catch (error) {
        logger.error('Failed to parse offline queue:', error, 'OfflineSync');
        localStorage.removeItem(QUEUE_STORAGE_KEY);
      }
    }
  }, []);

  // Зберегти чергу в localStorage при змінах
  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } else {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    }
  }, [queue]);

  // Обробники online/offline подій
  useEffect(() => {
    const handleOnline = () => {
      logger.info('🌐 Connection restored - starting sync', 'OfflineSync');
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => {
      logger.warn('📵 Connection lost - entering offline mode', 'OfflineSync');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Якщо є несинхронізовані дані і онлайн - синхронізувати
    if (navigator.onLine && queue.length > 0) {
      syncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queue.length]);

  // Додати дію в чергу
  const addToQueue = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0
    };

    setQueue(prev => [...prev, queuedAction]);
    logger.info(`📤 Action queued for offline sync: ${action.type} ${action.action}`, 'OfflineSync');

    // Якщо онлайн - спробувати синхронізувати відразу
    if (navigator.onLine) {
      setTimeout(() => syncQueue(), 100);
    }

    return queuedAction.id;
  }, []);

  // Видалити дію з черги
  const removeFromQueue = useCallback((actionId: string) => {
    setQueue(prev => prev.filter(a => a.id !== actionId));
  }, []);

  // Синхронізувати чергу з сервером
  const syncQueue = useCallback(async () => {
    if (isSyncing || queue.length === 0 || !navigator.onLine) {
      return;
    }

    setIsSyncing(true);
    logger.info(`🔄 Starting sync of ${queue.length} queued actions`, 'OfflineSync');

    const results = {
      success: 0,
      failed: 0,
      retried: 0
    };

    for (const action of queue) {
      try {
        // Динамічно імпортувати відповідний сервіс
        const service = await getServiceForType(action.type);

        // Виконати дію
        switch (action.action) {
          case 'create':
            await service.create(action.data);
            break;
          case 'update':
            await service.update(action.data);
            break;
          case 'delete':
            await service.delete(action.data.id);
            break;
        }

        // Успішно синхронізовано - видалити з черги
        removeFromQueue(action.id);
        results.success++;
        logger.info(`✅ Synced: ${action.type} ${action.action}`, 'OfflineSync');

      } catch (error) {
        logger.error(`❌ Failed to sync ${action.type} ${action.action}:`, error, 'OfflineSync');

        // Збільшити лічильник спроб
        if (action.retries < MAX_RETRIES) {
          setQueue(prev => prev.map(a =>
            a.id === action.id ? { ...a, retries: a.retries + 1 } : a
          ));
          results.retried++;
        } else {
          // Досягнуто максимум спроб - видалити з черги
          removeFromQueue(action.id);
          results.failed++;
          logger.error(`❌ Max retries reached for ${action.type} ${action.action}, removing from queue`, 'OfflineSync');
        }
      }
    }

    setIsSyncing(false);
    logger.info(`✅ Sync complete: ${results.success} success, ${results.retried} retried, ${results.failed} failed`, 'OfflineSync');

    // Якщо є дані для retry - спробувати знову через 5 секунд
    if (results.retried > 0) {
      setTimeout(() => syncQueue(), 5000);
    }
  }, [queue, isSyncing, removeFromQueue]);

  // Очистити чергу (для тестування або у разі необхідності)
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
    logger.info('🗑️ Offline queue cleared', 'OfflineSync');
  }, []);

  return {
    isOnline,
    queue,
    queueSize: queue.length,
    isSyncing,
    addToQueue,
    removeFromQueue,
    syncQueue,
    clearQueue
  };
}

// Helper функція для отримання відповідного сервісу
async function getServiceForType(type: QueuedAction['type']) {
  const supabaseService = await import('@/services/supabaseService');

  switch (type) {
    case 'hours':
      return {
        create: supabaseService.createHours,
        update: supabaseService.updateHours,
        delete: supabaseService.deleteHours
      };
    case 'process':
      return {
        create: supabaseService.createProcess,
        update: supabaseService.updateProcess,
        delete: supabaseService.deleteProcess
      };
    case 'material':
      return {
        create: supabaseService.createMaterial,
        update: (_data: any) => Promise.resolve(), // TODO: додати update для materials
        delete: supabaseService.deleteMaterial
      };
    case 'photo':
      return {
        create: supabaseService.createWorkPhoto,
        update: supabaseService.updateWorkPhoto,
        delete: supabaseService.deleteWorkPhoto
      };
    case 'assignment':
      return {
        create: supabaseService.createAssignment,
        update: supabaseService.updateAssignment,
        delete: (_id: string) => Promise.resolve() // TODO: додати delete для assignments
      };
    case 'additional_work':
      return {
        create: supabaseService.createAdditionalWork,
        update: supabaseService.updateAdditionalWork,
        delete: (_id: string) => Promise.resolve() // TODO: додати delete для additional works
      };
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}
