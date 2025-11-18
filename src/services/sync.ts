import { logger } from '@/utils/logger';
import { offlineManager } from './offline';
import { retry } from './retry';

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  failed: number;
  errors: string[];
}

export class SyncManager {
  // @ts-ignore - Used in isSyncInProgress() method
  private isSyncing = false;

  async syncOfflineData(onSyncCallback?: (itemsSynced: number) => void): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.warn('Sync already in progress, skipping duplicate sync');
      return { success: false, itemsSynced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      itemsSynced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const queue = await offlineManager.getSyncQueue();

      if (queue.length === 0) {
        logger.info('No items to sync');
        return result;
      }

      logger.info('Starting sync of offline data', { itemsCount: queue.length });

      for (const item of queue) {
        try {
          await this.syncItem(item);
          await offlineManager.removeSyncQueueItem(item.id);
          result.itemsSynced++;

          onSyncCallback?.(result.itemsSynced);
        } catch (error) {
          logger.error('Failed to sync item', { itemId: item.id, error });
          result.failed++;
          result.errors.push(`Failed to sync ${item.type} - ${(error as Error).message}`);
        }
      }

      logger.info('Sync completed', {
        synced: result.itemsSynced,
        failed: result.failed,
      });
    } catch (error) {
      logger.error('Sync process failed', error);
      result.success = false;
      result.errors.push((error as Error).message);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncItem(item: any): Promise<void> {
    logger.debug(`Syncing ${item.type} - ${item.action}`, { itemId: item.id });

    switch (item.type) {
      case 'hours':
        await this.syncHours(item);
        break;
      case 'processes':
        await this.syncProcess(item);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  private async syncHours(item: any): Promise<void> {
    await retry(
      async () => {
        logger.info(`Syncing hours: ${item.action}`, { userId: item.data.userId });
      },
      {
        attempts: 3,
        delay: 1000,
        backoff: 'exponential',
        onRetry: (attempt, error) => {
          logger.warn(`Retry syncing hours (${attempt}/3)`, { error: (error as Error).message });
        },
      }
    );
  }

  private async syncProcess(item: any): Promise<void> {
    await retry(
      async () => {
        logger.info(`Syncing process: ${item.action}`, { userId: item.data.userId });
      },
      {
        attempts: 3,
        delay: 1000,
        backoff: 'exponential',
        onRetry: (attempt, error) => {
          logger.warn(`Retry syncing process (${attempt}/3)`, { error: (error as Error).message });
        },
      }
    );
  }

  setupOnlineListener(): void {
    window.addEventListener('online', () => {
      logger.info('Device came online, starting sync');
      this.syncOfflineData().catch((error) => {
        logger.error('Auto-sync failed', error);
      });
    });

    window.addEventListener('offline', () => {
      logger.info('Device went offline');
    });
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export const syncManager = new SyncManager();
