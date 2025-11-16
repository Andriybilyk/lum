import { onCLS, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

export interface PerformanceMetrics {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface PerformanceThresholds {
  CLS: { good: number; needsImprovement: number };
  FID: { good: number; needsImprovement: number };
  FCP: { good: number; needsImprovement: number };
  LCP: { good: number; needsImprovement: number };
  TTFB: { good: number; needsImprovement: number };
}

const THRESHOLDS: PerformanceThresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 600, needsImprovement: 1200 },
};

const metrics: Map<string, PerformanceMetrics> = new Map();
const listeners: Array<(metric: PerformanceMetrics) => void> = [];

function getRating(
  metricName: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof PerformanceThresholds];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function handleMetric(metric: Metric): void {
  const perfMetric: PerformanceMetrics = {
    metric: metric.name,
    value: Math.round(metric.value),
    rating: getRating(metric.name, metric.value),
    timestamp: Date.now(),
  };

  metrics.set(metric.name, perfMetric);
  listeners.forEach(listener => listener(perfMetric));

  if (typeof window !== 'undefined' && window.console && process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}: ${perfMetric.value}ms (${perfMetric.rating})`);
  }
}

export function initializePerformanceMonitoring(): void {
  onCLS(handleMetric);
  onFCP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}

export function getMetric(name: string): PerformanceMetrics | undefined {
  return metrics.get(name);
}

export function getAllMetrics(): PerformanceMetrics[] {
  return Array.from(metrics.values());
}

export function subscribeToMetrics(
  callback: (metric: PerformanceMetrics) => void
): () => void {
  listeners.push(callback);

  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

export function reportMetrics(): PerformanceMetrics[] {
  const allMetrics = getAllMetrics();

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT || '/api/analytics';

    Promise.resolve().then(() => {
      const body = JSON.stringify({
        type: 'web-vitals',
        metrics: allMetrics,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, body);
      } else {
        fetch(endpoint, {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {});
      }
    });
  }

  return allMetrics;
}

export function getPerformanceSummary(): {
  overallScore: number;
  poorMetrics: string[];
  recommendations: string[];
} {
  const allMetrics = getAllMetrics();
  const poorMetrics = allMetrics
    .filter(m => m.rating === 'poor')
    .map(m => m.metric);

  const needsImprovementMetrics = allMetrics
    .filter(m => m.rating === 'needs-improvement')
    .map(m => m.metric);

  const recommendations: string[] = [];

  if (poorMetrics.includes('LCP')) {
    recommendations.push('Optimize largest contentful paint: reduce image sizes, use lazy loading');
  }

  if (poorMetrics.includes('CLS')) {
    recommendations.push('Stabilize layout shifts: set explicit dimensions for images/videos');
  }

  if (poorMetrics.includes('TTFB')) {
    recommendations.push('Improve time to first byte: optimize server response time');
  }

  if (needsImprovementMetrics.includes('FCP')) {
    recommendations.push('Improve first contentful paint: reduce critical rendering path');
  }

  const overallScore =
    100 -
    (poorMetrics.length * 30 + needsImprovementMetrics.length * 10);

  return {
    overallScore: Math.max(0, overallScore),
    poorMetrics,
    recommendations,
  };
}

export const performanceMonitoring = {
  init: initializePerformanceMonitoring,
  getMetric,
  getAllMetrics,
  subscribe: subscribeToMetrics,
  report: reportMetrics,
  getSummary: getPerformanceSummary,
};
