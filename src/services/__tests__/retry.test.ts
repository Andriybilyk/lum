import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retry, retryWithExponentialBackoff, retryWithLinearBackoff, isNetworkError, isServerError } from '@/services/retry';

describe('retry service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retry function', () => {
    it('should return data on first attempt success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn, { attempts: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed on second attempt', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const result = await retry(fn, { attempts: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry specified number of attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Error'));

      try {
        await retry(fn, { attempts: 3 });
      } catch {
        // Expected to fail
      }

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after all attempts fail', async () => {
      const error = new Error('Persistent error');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(retry(fn, { attempts: 2 })).rejects.toThrow('Persistent error');
    });

    it('should call onRetry callback on retries', async () => {
      const onRetry = vi.fn();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      await retry(fn, { attempts: 3, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error));
    });

    it('should respect shouldRetry predicate', async () => {
      const shouldRetry = vi.fn().mockReturnValue(false);
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        retry(fn, { attempts: 3, shouldRetry })
      ).rejects.toThrow('Network error');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should apply exponential backoff delay', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      await retry(fn, { attempts: 2, delay: 100, backoff: 'exponential' });
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should apply linear backoff delay', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      await retry(fn, { attempts: 2, delay: 50, backoff: 'linear' });
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('retryWithExponentialBackoff', () => {
    it('should use exponential backoff by default', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(fn, 3);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Error'));

      await expect(retryWithExponentialBackoff(fn, 2)).rejects.toThrow('Error');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryWithLinearBackoff', () => {
    it('should use linear backoff', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retryWithLinearBackoff(fn, 3);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Error'));

      await expect(retryWithLinearBackoff(fn, 2)).rejects.toThrow('Error');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('error detection', () => {
    describe('isNetworkError', () => {
      it('should detect network errors', () => {
        expect(isNetworkError(new Error('Network error'))).toBe(true);
        expect(isNetworkError(new Error('fetch failed'))).toBe(true);
        expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
        expect(isNetworkError(new Error('timeout'))).toBe(true);
      });

      it('should not detect other errors as network errors', () => {
        expect(isNetworkError(new Error('Validation error'))).toBe(false);
        expect(isNetworkError(new Error('500 Internal Server Error'))).toBe(false);
      });
    });

    describe('isServerError', () => {
      it('should detect server errors', () => {
        expect(isServerError(new Error('500 Internal Server Error'))).toBe(true);
        expect(isServerError(new Error('502 Bad Gateway'))).toBe(true);
        expect(isServerError(new Error('503 Service Unavailable'))).toBe(true);
        expect(isServerError(new Error('504 Gateway Timeout'))).toBe(true);
      });

      it('should not detect other errors as server errors', () => {
        expect(isServerError(new Error('Network error'))).toBe(false);
        expect(isServerError(new Error('404 Not Found'))).toBe(false);
        expect(isServerError(new Error('400 Bad Request'))).toBe(false);
      });
    });
  });
});
