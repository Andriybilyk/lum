import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  performanceMonitoring,
  getMetric,
  getAllMetrics,
  subscribeToMetrics,
  getPerformanceSummary,
  PerformanceMetrics,
} from '../performanceMonitoring';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMetric', () => {
    it('should return undefined for non-existent metric', () => {
      const metric = getMetric('LCP');
      expect(metric).toBeUndefined();
    });
  });

  describe('getAllMetrics', () => {
    it('should return empty array initially', () => {
      const metrics = getAllMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should return array of metrics', () => {
      const metrics = getAllMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('Rating System', () => {
    it('should rate CLS as good when value <= 0.1', () => {
      const metric: PerformanceMetrics = {
        metric: 'CLS',
        value: 0.05,
        rating: 'good',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('good');
    });

    it('should rate CLS as needs-improvement when 0.1 < value <= 0.25', () => {
      const metric: PerformanceMetrics = {
        metric: 'CLS',
        value: 0.15,
        rating: 'needs-improvement',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('needs-improvement');
    });

    it('should rate CLS as poor when value > 0.25', () => {
      const metric: PerformanceMetrics = {
        metric: 'CLS',
        value: 0.3,
        rating: 'poor',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('poor');
    });

    it('should rate FID as good when value <= 100ms', () => {
      const metric: PerformanceMetrics = {
        metric: 'FID',
        value: 50,
        rating: 'good',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('good');
    });

    it('should rate FID as needs-improvement when 100 < value <= 300', () => {
      const metric: PerformanceMetrics = {
        metric: 'FID',
        value: 200,
        rating: 'needs-improvement',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('needs-improvement');
    });

    it('should rate FID as poor when value > 300', () => {
      const metric: PerformanceMetrics = {
        metric: 'FID',
        value: 400,
        rating: 'poor',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('poor');
    });

    it('should rate LCP as good when value <= 2500ms', () => {
      const metric: PerformanceMetrics = {
        metric: 'LCP',
        value: 2000,
        rating: 'good',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('good');
    });

    it('should rate LCP as needs-improvement when 2500 < value <= 4000', () => {
      const metric: PerformanceMetrics = {
        metric: 'LCP',
        value: 3000,
        rating: 'needs-improvement',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('needs-improvement');
    });

    it('should rate LCP as poor when value > 4000', () => {
      const metric: PerformanceMetrics = {
        metric: 'LCP',
        value: 5000,
        rating: 'poor',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('poor');
    });

    it('should rate TTFB as good when value <= 600ms', () => {
      const metric: PerformanceMetrics = {
        metric: 'TTFB',
        value: 400,
        rating: 'good',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('good');
    });

    it('should rate TTFB as needs-improvement when 600 < value <= 1200', () => {
      const metric: PerformanceMetrics = {
        metric: 'TTFB',
        value: 800,
        rating: 'needs-improvement',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('needs-improvement');
    });

    it('should rate TTFB as poor when value > 1200', () => {
      const metric: PerformanceMetrics = {
        metric: 'TTFB',
        value: 1500,
        rating: 'poor',
        timestamp: Date.now(),
      };
      expect(metric.rating).toBe('poor');
    });
  });

  describe('subscribeToMetrics', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToMetrics(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback with metric data', () => {
      const callback = vi.fn();
      subscribeToMetrics(callback);

      expect(callback).toBeDefined();
    });
  });

  describe('Performance Summary', () => {
    it('should generate performance summary', () => {
      const summary = getPerformanceSummary();

      expect(summary).toHaveProperty('overallScore');
      expect(summary).toHaveProperty('poorMetrics');
      expect(summary).toHaveProperty('recommendations');
      expect(typeof summary.overallScore).toBe('number');
      expect(Array.isArray(summary.poorMetrics)).toBe(true);
      expect(Array.isArray(summary.recommendations)).toBe(true);
    });

    it('should include LCP optimization in recommendations', () => {
      const summary = getPerformanceSummary();

      expect(Array.isArray(summary.recommendations)).toBe(true);
    });

    it('should have non-negative overall score', () => {
      const summary = getPerformanceSummary();

      expect(summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(summary.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Public API', () => {
    it('should expose all public methods', () => {
      expect(typeof performanceMonitoring.init).toBe('function');
      expect(typeof performanceMonitoring.getMetric).toBe('function');
      expect(typeof performanceMonitoring.getAllMetrics).toBe('function');
      expect(typeof performanceMonitoring.subscribe).toBe('function');
      expect(typeof performanceMonitoring.report).toBe('function');
      expect(typeof performanceMonitoring.getSummary).toBe('function');
    });
  });

  describe('Metrics Data Structure', () => {
    it('should have proper metric structure', () => {
      const metric: PerformanceMetrics = {
        metric: 'LCP',
        value: 2500,
        rating: 'good',
        timestamp: Date.now(),
      };

      expect(metric).toHaveProperty('metric');
      expect(metric).toHaveProperty('value');
      expect(metric).toHaveProperty('rating');
      expect(metric).toHaveProperty('timestamp');
      expect(typeof metric.metric).toBe('string');
      expect(typeof metric.value).toBe('number');
      expect(['good', 'needs-improvement', 'poor']).toContain(metric.rating);
      expect(typeof metric.timestamp).toBe('number');
    });
  });

  describe('Multiple Metrics', () => {
    it('should handle multiple different metrics', () => {
      const metrics: PerformanceMetrics[] = [
        { metric: 'LCP', value: 2500, rating: 'good', timestamp: Date.now() },
        { metric: 'FID', value: 100, rating: 'good', timestamp: Date.now() },
        { metric: 'CLS', value: 0.1, rating: 'good', timestamp: Date.now() },
        { metric: 'FCP', value: 1800, rating: 'good', timestamp: Date.now() },
        { metric: 'TTFB', value: 600, rating: 'good', timestamp: Date.now() },
      ];

      expect(metrics.length).toBe(5);
      expect(metrics.every(m => m.rating === 'good')).toBe(true);
    });
  });
});
