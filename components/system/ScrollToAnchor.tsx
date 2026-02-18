'use client';

import { useEffect } from 'react';

export function ScrollToAnchor() {
  useEffect(() => {
    // Check if there's a hash in the URL
    const hash = window.location.hash;
    if (hash) {
      // Remove the # character
      const elementId = hash.slice(1);
      const element = document.getElementById(elementId);
      
      if (element) {
        // Add a small delay to ensure the page is fully rendered
        const timeoutId = setTimeout(() => {
          const headerHeight = 80; // Account for fixed header
          const targetPosition = element.offsetTop - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, []);

  return null;
}
