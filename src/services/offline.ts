import { logger } from '@/utils/logger';
import { Hours, Process } from '@/utils/validation';

interface SyncQueueItem {
  id: string;
  action: 'add' | 'update' | 'delete';
  type: 'hours' | 'processes';
  data: any;
  timestamp: number;
  retries: number;
}

export class OfflineManager {
  private db: IDBDatabase | null = null;
  private dbName = 'hr-system';
  private dbVersion = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', { error: request.error });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('hours')) {
          db.createObjectStore('hours', { keyPath: 'id' });
          logger.info('Created hours object store');
        }

        if (!db.objectStoreNames.contains('processes')) {
          db.createObjectStore('processes', { keyPath: 'id' });
          logger.info('Created processes object store');
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
          logger.info('Created syncQueue object store');
        }
      };
    });
  }

  async saveHours(hours: Hours): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['hours'], 'readwrite');
      const store = transaction.objectStore('hours');
      const request = store.put(hours);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.info('Hours saved to offline storage', { id: hours.id });
        resolve();
      };
    });
  }

  async saveProcess(process: Process): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['processes'], 'readwrite');
      const store = transaction.objectStore('processes');
      const request = store.put(process);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.info('Process saved to offline storage', { id: process.id });
        resolve();
      };
    });
  }

  async addToSyncQueue(
    action: 'add' | 'update' | 'delete',
    type: 'hours' | 'processes',
    data: any
  ): Promise<void> {
    if (!this.db) await this.init();

    const queueItem: SyncQueueItem = {
      id: `${type}-${action}-${Date.now()}`,
      action,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(queueItem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.info('Item added to sync queue', { id: queueItem.id, type });
        resolve();
      };
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.info('Item removed from sync queue', { id });
        resolve();
      };
    });
  }

  async getAllHours(): Promise<Hours[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['hours'], 'readonly');
      const store = transaction.objectStore('hours');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async getAllProcesses(): Promise<Process[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['processes'], 'readonly');
      const store = transaction.objectStore('processes');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async clearOfflineData(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['hours', 'processes', 'syncQueue'],
        'readwrite'
      );

      const hoursClear = transaction.objectStore('hours').clear();
      const processesClear = transaction.objectStore('processes').clear();
      const queueClear = transaction.objectStore('syncQueue').clear();

      hoursClear.onerror = () => reject(hoursClear.error);
      processesClear.onerror = () => reject(processesClear.error);
      queueClear.onerror = () => reject(queueClear.error);

      transaction.oncomplete = () => {
        logger.info('Offline data cleared');
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const offlineManager = new OfflineManager();
