'use client';

import React, { Suspense } from 'react';
import { useOffline } from '@/lib/hooks/useOffline';

// Lazy load heavy offline components
const OfflineIndicator = React.lazy(() => 
  import('@/components/OfflineIndicator').then(mod => ({ default: mod.OfflineIndicator }))
);

interface ConditionalOfflineFeaturesProps {
  children: React.ReactNode;
  enableOfflineFeatures?: boolean; // Feature flag
  performanceThreshold?: number; // Only enable if device is fast enough
}

export function ConditionalOfflineFeatures({
  children,
  enableOfflineFeatures = true,
  performanceThreshold = 1000 // ms threshold for enabling features
}: ConditionalOfflineFeaturesProps) {
  const { isOnline } = useOffline();
  const [shouldEnableFeatures, setShouldEnableFeatures] = React.useState(false);
  const [deviceScore, setDeviceScore] = React.useState(0);

  // Device capability detection
  React.useEffect(() => {
    if (!enableOfflineFeatures) {
      setShouldEnableFeatures(false);
      return;
    }

    // Quick performance test
    const start = performance.now();
    
    // Simple computational test
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += Math.sqrt(i);
    }
    
    const end = performance.now();
    const score = end - start;
    setDeviceScore(score);
    
    // Enable features if device is fast enough
    setShouldEnableFeatures(score < performanceThreshold);
    
    console.log(`[Perf] Device score: ${score.toFixed(2)}ms (${score < performanceThreshold ? 'Fast' : 'Slow'})`);
  }, [enableOfflineFeatures, performanceThreshold]);

  // Don't render offline features on slow devices or when disabled
  if (!shouldEnableFeatures || !enableOfflineFeatures) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {!isOnline && (
        <Suspense fallback={null}>
          <OfflineIndicator />
        </Suspense>
      )}
    </>
  );
}

// Higher-order component version
export function withConditionalOffline<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ConditionalOfflineFeaturesProps, 'children'>
) {
  return function ConditionalOfflineWrapper(props: P) {
    return (
      <ConditionalOfflineFeatures {...options}>
        <WrappedComponent {...props} />
      </ConditionalOfflineFeatures>
    );
  };
}