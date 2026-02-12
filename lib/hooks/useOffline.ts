'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Optimized hook to detect online/offline status with performance considerations
 * @returns {Object} { isOnline, isOffline }
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);

  // Memoized handlers to prevent unnecessary re-renders
  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Add passive event listeners for better performance
    window.addEventListener('online', handleOnline, { passive: true });
    window.addEventListener('offline', handleOffline, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]); // Dependencies are memoized

  return {
    isOnline,
    isOffline: !isOnline,
  };
}

// Throttled version for high-frequency updates
export function useOfflineThrottled(delay: number = 1000) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const handleConnectionChange = () => {
      const now = Date.now();
      if (now - lastUpdate > delay) {
        setIsOnline(navigator.onLine);
        setLastUpdate(now);
      }
    };

    window.addEventListener('online', handleConnectionChange, { passive: true });
    window.addEventListener('offline', handleConnectionChange, { passive: true });

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, [lastUpdate, delay]);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}