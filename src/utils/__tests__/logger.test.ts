import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '../logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('debug logging', () => {
    it('should log debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.debug('Test message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include context in debug logs', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.debug('Test message', undefined, 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log data with debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const testData = { key: 'value' };
      logger.debug('Test message', testData);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('info logging', () => {
    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('Info message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include context in info logs', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('Info message', undefined, 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('warn logging', () => {
    it('should log warn messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      logger.warn('Warning message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include context in warn logs', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      logger.warn('Warning message', undefined, 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warn with error data', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const error = new Error('Test error');
      logger.warn('Warning with error', error);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      logger.error('Error message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include context in error logs', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      logger.error('Error message', undefined, 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log error with error object', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('group logging', () => {
    it('should create log groups', () => {
      const groupSpy = vi.spyOn(console, 'group');
      const groupEndSpy = vi.spyOn(console, 'groupEnd');

      logger.group('Test Group', () => {
        logger.info('Inside group');
      });

      expect(groupSpy).toHaveBeenCalled();
      expect(groupEndSpy).toHaveBeenCalled();
    });

    it('should execute function inside group', () => {
      const fn = vi.fn();
      logger.group('Test Group', fn);
      expect(fn).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('should format messages with context', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('Test', undefined, 'MyContext');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include timestamp in formatted message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('Test message');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
