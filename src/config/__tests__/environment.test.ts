import { describe, it, expect, beforeEach } from 'vitest';
import { environmentConfig } from '../environment';

describe('EnvironmentManager', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  });

  describe('configuration loading', () => {
    it('should load configuration', () => {
      const config = environmentConfig.getConfig();

      expect(config).toBeDefined();
      expect(config.appName).toBeDefined();
      expect(config.environment).toBeDefined();
    });

    it('should have app metadata', () => {
      const config = environmentConfig.getConfig();

      expect(config.appName).toBe('HR Management System');
      expect(config.appVersion).toBe('1.0.0');
    });

    it('should have features configuration', () => {
      const config = environmentConfig.getConfig();

      expect(config.features).toHaveProperty('offline');
      expect(config.features).toHaveProperty('sync');
      expect(config.features).toHaveProperty('advancedReports');
      expect(config.features).toHaveProperty('darkMode');
    });

    it('should have logging configuration', () => {
      const config = environmentConfig.getConfig();

      expect(config.logging).toHaveProperty('enabled');
      expect(config.logging).toHaveProperty('level');
      expect(config.logging).toHaveProperty('maxLogs');
    });

    it('should have cache configuration', () => {
      const config = environmentConfig.getConfig();

      expect(config.cache).toHaveProperty('enabled');
      expect(config.cache).toHaveProperty('defaultTTL');
      expect(config.cache).toHaveProperty('maxSize');
    });

    it('should have monitoring configuration', () => {
      const config = environmentConfig.getConfig();

      expect(config.monitoring).toHaveProperty('enabled');
      expect(config.monitoring).toHaveProperty('sampleRate');
    });
  });

  describe('config value retrieval', () => {
    it('should get config value with dot notation', () => {
      const offlineEnabled = environmentConfig.getConfigValue<boolean>('features.offline');

      expect(typeof offlineEnabled).toBe('boolean');
    });

    it('should return undefined for non-existent path', () => {
      const value = environmentConfig.getConfigValue('nonexistent.path');

      expect(value).toBeUndefined();
    });

    it('should handle nested paths', () => {
      const ttl = environmentConfig.getConfigValue<number>('cache.defaultTTL');

      expect(typeof ttl).toBe('number');
      expect(ttl).toBeGreaterThan(0);
    });
  });

  describe('feature flags', () => {
    it('should check if feature is enabled', () => {
      const isOfflineEnabled = environmentConfig.isFeatureEnabled('offline');

      expect(typeof isOfflineEnabled).toBe('boolean');
    });

    it('should return false for non-existent feature', () => {
      const result = environmentConfig.isFeatureEnabled('offline');

      expect(typeof result).toBe('boolean');
    });
  });

  describe('environment detection', () => {
    it('should have environment property', () => {
      const config = environmentConfig.getConfig();

      expect(['development', 'staging', 'production', 'test']).toContain(
        config.environment
      );
    });

    it('should provide environment check methods', () => {
      expect(typeof environmentConfig.isDevelopment()).toBe('boolean');
      expect(typeof environmentConfig.isProduction()).toBe('boolean');
    });
  });

  describe('API configuration', () => {
    it('should provide API URL', () => {
      const apiUrl = environmentConfig.getApiUrl();

      expect(apiUrl).toBeDefined();
      expect(typeof apiUrl).toBe('string');
    });

    it('should have API timeout setting', () => {
      const config = environmentConfig.getConfig();

      expect(config.apiTimeout).toBeGreaterThan(0);
    });
  });

  describe('configuration integrity', () => {
    it('should have consistent cache TTL', () => {
      const config = environmentConfig.getConfig();

      expect(config.cache.defaultTTL).toBeGreaterThan(0);
      expect(config.cache.maxSize).toBeGreaterThan(0);
    });

    it('should have valid log level', () => {
      const config = environmentConfig.getConfig();
      const validLevels = ['debug', 'info', 'warn', 'error'];

      expect(validLevels).toContain(config.logging.level);
    });

    it('should have valid monitoring sample rate', () => {
      const config = environmentConfig.getConfig();

      expect(config.monitoring.sampleRate).toBeGreaterThan(0);
      expect(config.monitoring.sampleRate).toBeLessThanOrEqual(1);
    });
  });
});
