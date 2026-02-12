// Performance monitoring utilities
'use client';

import React from 'react';

interface PerformanceMetrics {
  swInstallTime?: number;
  cacheHitRate?: number;
  offlineTransitionTime?: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private startTime: number = 0;

  startMeasurement(name: string) {
    this.startTime = performance.now();
    console.log(`[Perf] Starting measurement: ${name}`);
  }

  endMeasurement(name: string): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    console.log(`[Perf] ${name} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  recordMetric(key: keyof PerformanceMetrics, value: number) {
    this.metrics[key] = value;
    console.log(`[Perf] Recorded ${key}: ${value}`);
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Service Worker specific measurements
  measureSWPerformance() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          console.log('[Perf] SW State:', registration.active?.state);
          console.log('[Perf] SW Script URL:', registration.active?.scriptURL);
        });
      });
    }
  }
}

export const perfMonitor = new PerformanceMonitor();

// Utility to measure React component render times
export function measureRenderTime(componentName: string) {
  return function <T extends React.ComponentType<any>>(WrappedComponent: T) {
    const MeasuredComponent = (props: React.ComponentProps<T>) => {
      const start = performance.now();
      
      // Measure render completion
      React.useEffect(() => {
        const renderTime = performance.now() - start;
        perfMonitor.recordMetric('offlineTransitionTime', renderTime);
        console.log(`[Perf] ${componentName} render time: ${renderTime.toFixed(2)}ms`);
      });

      return React.createElement(WrappedComponent, props);
    };
    
    return MeasuredComponent;
  };
}