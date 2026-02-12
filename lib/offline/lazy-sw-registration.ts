// Lazy Service Worker Registration
// Defers SW registration to improve initial page load performance

'use client';

import React from 'react';

interface SWRegistrationOptions {
  delay?: number; // Delay in ms before registration
  conditions?: {
    idleCallback?: boolean; // Use requestIdleCallback if available
    networkStatus?: 'online' | 'always'; // Register only when online or always
  };
}

export class LazySWRegistration {
  private static instance: LazySWRegistration;
  private hasRegistered = false;
  private registrationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): LazySWRegistration {
    if (!LazySWRegistration.instance) {
      LazySWRegistration.instance = new LazySWRegistration();
    }
    return LazySWRegistration.instance;
  }

  async register(options: SWRegistrationOptions = {}): Promise<void> {
    // Prevent multiple registrations
    if (this.hasRegistered || this.registrationPromise) {
      return this.registrationPromise || Promise.resolve();
    }

    const { 
      delay = 5000, // Default 5 second delay
      conditions = { idleCallback: true, networkStatus: 'online' }
    } = options;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service Workers not supported');
      return Promise.resolve();
    }

    // Check network conditions
    if (conditions.networkStatus === 'online' && !navigator.onLine) {
      console.log('[SW] Deferring registration until online');
      return new Promise((resolve) => {
        const onlineHandler = () => {
          window.removeEventListener('online', onlineHandler);
          this.register(options).then(resolve);
        };
        window.addEventListener('online', onlineHandler);
      });
    }

    this.registrationPromise = new Promise<void>((resolve, reject) => {
      const registerSW = () => {
        if (this.hasRegistered) {
          resolve();
          return;
        }

        console.log('[SW] Starting lazy registration...');
        
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('[SW] Registered successfully:', registration);
            this.hasRegistered = true;
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('[SW] New content available');
                    } else {
                      console.log('[SW] Content cached for offline use');
                    }
                  }
                });
              }
            });
            
            resolve();
          })
          .catch((error) => {
            console.error('[SW] Registration failed:', error);
            reject(error);
          });
      };

      // Apply delay strategy
      if (delay > 0) {
        if (conditions.idleCallback && 'requestIdleCallback' in window) {
          // Use idle callback for optimal timing
          (window as any).requestIdleCallback(() => {
            setTimeout(registerSW, delay);
          });
        } else {
          // Simple timeout fallback
          setTimeout(registerSW, delay);
        }
      } else {
        // Register immediately
        registerSW();
      }
    });

    return this.registrationPromise;
  }

  // Force immediate registration (for user-initiated actions)
  async registerImmediately(): Promise<void> {
    return this.register({ delay: 0 });
  }

  // Check registration status
  isRegistered(): boolean {
    return this.hasRegistered;
  }

  // Get registration promise
  getRegistrationPromise(): Promise<void> | null {
    return this.registrationPromise;
  }
}

// Export singleton instance
export const lazySW = LazySWRegistration.getInstance();

// Hook for React components
export function useLazySWRegistration(options?: SWRegistrationOptions) {
  React.useEffect(() => {
    lazySW.register(options);
  }, []);
}