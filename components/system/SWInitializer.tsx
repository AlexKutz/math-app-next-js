'use client';

import React from 'react';
import { lazySW } from '@/lib/offline/lazy-sw-registration';

export function SWInitializer() {
  React.useEffect(() => {
    lazySW.register({
      delay: 3000, // 3 second delay
      conditions: {
        idleCallback: true,
        networkStatus: 'online'
      }
    });
  }, []);

  return null; // This component doesn't render anything
}