'use client';

import React, { useState, useEffect } from 'react';
import { perfMonitor } from '@/lib/performance/metrics';

interface PerformanceData {
  metrics: Record<string, number>;
  swStatus: string;
  swState: string;
  cacheSize: number;
  cacheNames: string[];
  deviceInfo: {
    memory?: number;
    cores?: number;
    connection?: string;
  };
  navigationTiming: {
    dnsLookup?: number;
    tcpConnect?: number;
    requestTime?: number;
    responseTime?: number;
    domContentLoaded?: number;
    loadTime?: number;
  };
  memoryUsage: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData>({
    metrics: {},
    swStatus: 'Unknown',
    swState: 'Unknown',
    cacheSize: 0,
    cacheNames: [],
    deviceInfo: {},
    navigationTiming: {},
    memoryUsage: {}
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('PerformanceDashboard useEffect running...');
    
    // Update performance data periodically
    const updateData = async () => {
      const metrics = perfMonitor.getMetrics();
      
      // Get service worker status and detailed info
      let swStatus = 'Not Supported';
      let swState = 'Unknown';
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swStatus = registrations.length > 0 ? 'Active' : 'Not Registered';
        if (registrations.length > 0 && registrations[0].active) {
          swState = registrations[0].active.state;
        }
      }
      
      // Get detailed cache information
      let cacheSize = 0;
      let cacheNames: string[] = [];
      if ('caches' in window) {
        try {
          cacheNames = await caches.keys();
          cacheSize = cacheNames.length;
        } catch (e) {
          console.warn('Could not access cache:', e);
        }
      }
      
      // Device information
      const deviceInfo = {
        memory: (navigator as any).deviceMemory || undefined,
        cores: navigator.hardwareConcurrency || undefined,
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      };
      
      // Navigation timing performance
      let navigationTiming = {};
      if (typeof performance !== 'undefined' && performance.timing) {
        const timing = performance.timing;
        const navStart = timing.navigationStart;
        navigationTiming = {
          dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
          tcpConnect: timing.connectEnd - timing.connectStart,
          requestTime: timing.responseStart - timing.requestStart,
          responseTime: timing.responseEnd - timing.responseStart,
          domContentLoaded: timing.domContentLoadedEventEnd - navStart,
          loadTime: timing.loadEventEnd - navStart
        };
      }
      
      // Memory usage
      let memoryUsage = {};
      if ((performance as any).memory) {
        const mem = (performance as any).memory;
        memoryUsage = {
          usedJSHeapSize: Math.round(mem.usedJSHeapSize / 1048576 * 100) / 100, // MB
          totalJSHeapSize: Math.round(mem.totalJSHeapSize / 1048576 * 100) / 100, // MB
          jsHeapSizeLimit: Math.round(mem.jsHeapSizeLimit / 1048576 * 100) / 100 // MB
        };
      }
      
      setData({
        metrics: metrics as Record<string, number>,
        swStatus,
        swState,
        cacheSize,
        cacheNames,
        deviceInfo,
        navigationTiming,
        memoryUsage
      });
    };
    
    updateData();
    const interval = setInterval(updateData, 3000); // Update every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-5 left-20 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium z-50 shadow-lg hover:shadow-xl transition-all"
      >
        📊 Perf
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 left-20 bg-background border border-border rounded-lg p-4 max-w-sm z-50 shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-foreground">Performance Dashboard</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3 text-sm">
        {/* Service Worker Info */}
        <div className="bg-muted rounded-lg p-3">
          <h4 className="font-medium text-foreground mb-2">Service Worker</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={data.swStatus === 'Active' ? 'text-green-600' : 'text-yellow-600'}>
                {data.swStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">State:</span>
              <span className="text-foreground">{data.swState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cache Entries:</span>
              <span className="text-foreground">{data.cacheSize}</span>
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="bg-muted rounded-lg p-3">
          <h4 className="font-medium text-foreground mb-2">Device</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cores:</span>
              <span className="text-foreground">{data.deviceInfo.cores || 'Unknown'}</span>
            </div>
            {data.deviceInfo.memory && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Memory:</span>
                <span className="text-foreground">{data.deviceInfo.memory} GB</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection:</span>
              <span className="text-foreground capitalize">{data.deviceInfo.connection}</span>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        {Object.keys(data.memoryUsage).length > 0 && (
          <div className="bg-muted rounded-lg p-3">
            <h4 className="font-medium text-foreground mb-2">Memory (MB)</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used:</span>
                <span className="text-foreground">{data.memoryUsage.usedJSHeapSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="text-foreground">{data.memoryUsage.totalJSHeapSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limit:</span>
                <span className="text-foreground">{data.memoryUsage.jsHeapSizeLimit}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Timing */}
        {Object.keys(data.navigationTiming).length > 0 && (
          <div className="bg-muted rounded-lg p-3">
            <h4 className="font-medium text-foreground mb-2">Timing (ms)</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">DNS Lookup:</span>
                <span className="text-foreground">{data.navigationTiming.dnsLookup}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TCP Connect:</span>
                <span className="text-foreground">{data.navigationTiming.tcpConnect}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Request:</span>
                <span className="text-foreground">{data.navigationTiming.requestTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Response:</span>
                <span className="text-foreground">{data.navigationTiming.responseTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DOM Loaded:</span>
                <span className="text-foreground">{data.navigationTiming.domContentLoaded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Page Load:</span>
                <span className="text-foreground">{data.navigationTiming.loadTime}</span>
              </div>
            </div>
          </div>
        )}

        {/* Custom Metrics */}
        {Object.keys(data.metrics).length > 0 && (
          <div className="bg-muted rounded-lg p-3">
            <h4 className="font-medium text-foreground mb-2">Custom Metrics</h4>
            <div className="space-y-1">
              {Object.entries(data.metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-foreground">{value.toFixed(2)}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => perfMonitor.measureSWPerformance()}
          className="flex-1 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90 transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={() => {
            // Clear performance data
            perfMonitor['metrics'] = {};
            setData(prev => ({...prev, metrics: {}}));
          }}
          className="flex-1 py-2 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}