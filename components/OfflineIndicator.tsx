'use client';

import { useOffline } from '@/lib/hooks/useOffline';
import { perfMonitor } from '@/lib/performance/metrics';
import { FiWifi, FiWifiOff } from 'react-icons/fi';
import React from 'react';

export function OfflineIndicator() {
  const { isOffline } = useOffline();
  
  // Performance monitoring
  React.useEffect(() => {
    if (isOffline) {
      perfMonitor.startMeasurement('offlineIndicatorShow');
    }
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
        <FiWifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Офлайн режим</span>
      </div>
    </div>
  );
}