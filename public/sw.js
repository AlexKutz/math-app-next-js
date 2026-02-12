const CACHE_NAME = 'math-app-cache-v5';
const urlsToCache = [
  '/', // Only cache homepage initially
  // Other pages will be cached on-demand (runtime caching)
];

// Performance optimization: Minimal initial cache
const PERFORMANCE_CONFIG = {
  maxCacheEntries: 50,
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  cacheStrategy: 'stale-while-revalidate'
};

// Install event - minimal cache for faster installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installing with performance optimizations...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('[SW] Essential URLs cached successfully');
            self.skipWaiting();
          })
          .catch((error) => {
            console.warn('[SW] Failed to cache initial URLs:', error);
          });
      })
  );
});

// Activate event - cleanup and optimization
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating with cleanup...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      clients.claim()
    ])
  );
});

// Optimized fetch handler with performance monitoring
self.addEventListener('fetch', (event) => {
  // Performance: Early returns for non-essential requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.indexOf(self.location.origin) !== 0) return;
  if (event.request.url.includes('/api/')) return;
  if (event.request.url.includes('/_next/static/')) return; // Let Next.js handle static assets
  
  event.respondWith(handleFetch(event));
});

async function handleFetch(event) {
  const requestUrl = event.request.url;
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try cache first for better performance
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      console.log('[SW] Cache hit:', requestUrl);
      
      // Stale-while-revalidate strategy
      event.waitUntil(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
          })
          .catch(() => {
            // Network failed, keep using cached version
            console.log('[SW] Network failed, keeping cached version');
          })
      );
      
      return cachedResponse;
    }
    
    // Cache miss - fetch from network
    console.log('[SW] Cache miss, fetching:', requestUrl);
    const networkResponse = await fetch(event.request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      const responseToCache = networkResponse.clone();
      event.waitUntil(cache.put(event.request, responseToCache));
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network error for:', requestUrl, error);
    
    // For navigation requests, return offline page
    if (event.request.mode === 'navigate') {
      const offlineResponse = await cache.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
      
      // Fallback offline page
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Offline</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              margin: 0; 
              background: #f5f5f5;
            }
            .container { 
              text-align: center; 
              padding: 2rem; 
              background: white; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📡 Offline Mode</h1>
            <p>You are currently offline. Please check your internet connection.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // For other requests, return basic error
    return new Response('Network error occurred', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    // Remove old entries
    const now = Date.now();
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const cacheTime = new Date(dateHeader).getTime();
          if (now - cacheTime > PERFORMANCE_CONFIG.maxCacheAge) {
            await cache.delete(request);
            console.log('[SW] Deleted expired cache entry:', request.url);
          }
        }
      }
    }
    
    // Limit total entries
    if (keys.length > PERFORMANCE_CONFIG.maxCacheEntries) {
      const sortedKeys = keys.sort((a, b) => {
        // Sort by last accessed (approximated by URL order)
        return a.url.localeCompare(b.url);
      });
      
      for (let i = 0; i < keys.length - PERFORMANCE_CONFIG.maxCacheEntries; i++) {
        await cache.delete(sortedKeys[i]);
        console.log('[SW] Deleted oldest cache entry:', sortedKeys[i].url);
      }
    }
  } catch (error) {
    console.warn('[SW] Cache cleanup error:', error);
  }
}, 60 * 60 * 1000); // Run every hour