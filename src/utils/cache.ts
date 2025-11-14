import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Простий менеджер кешу з TTL (Time To Live)
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Встановити значення в кеш
   * @param key ключ кешу
   * @param data дані для кешування
   * @param ttlMs час життя кешу в мс (за замовчуванням 5 хвилин)
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
    logger.debug(`Cache set: ${key}`);
  }

  /**
   * Отримати значення з кешу
   * @param key ключ кешу
   * @returns значення з кешу або null якщо кеш закінчився або ключ не існує
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Перевірити чи існує ключ в кешу
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Видалити значення з кешу
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache deleted: ${key}`);
  }

  /**
   * Очистити весь кеш
   */
  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Отримати розмір кешу
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Отримати статистику кешу
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Очистити закінчені записи кешу
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cache cleanup removed ${cleanedCount} expired entries`);
    }

    return cleanedCount;
  }
}

export const cacheManager = new CacheManager();
