import { logger } from '@/utils/logger';

export interface RetryOptions {
  attempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export const retry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    attempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!shouldRetry(lastError)) {
        logger.error('Retry aborted: non-retryable error', { error: lastError.message }, 'retry');
        throw lastError;
      }

      if (i < attempts - 1) {
        const waitTime =
          backoff === 'exponential'
            ? delay * Math.pow(2, i)
            : delay * (i + 1);

        const attemptNumber = i + 1;
        logger.warn(
          `Retry attempt ${attemptNumber}/${attempts}`,
          {
            error: lastError.message,
            waitTime,
          },
          'retry'
        );

        onRetry?.(attemptNumber, lastError);

        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        logger.error(
          `All ${attempts} retry attempts failed`,
          { error: lastError.message },
          'retry'
        );
      }
    }
  }

  throw lastError || new Error('Retry failed');
};

export const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> => {
  return retry(fn, {
    attempts: maxAttempts,
    delay: 1000,
    backoff: 'exponential',
  });
};

export const retryWithLinearBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> => {
  return retry(fn, {
    attempts: maxAttempts,
    delay: 1000,
    backoff: 'linear',
  });
};

export const isNetworkError = (error: Error): boolean => {
  return (
    error.message.includes('Network') ||
    error.message.includes('fetch') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('timeout')
  );
};

export const isServerError = (error: Error): boolean => {
  return (
    error.message.includes('500') ||
    error.message.includes('502') ||
    error.message.includes('503') ||
    error.message.includes('504')
  );
};
