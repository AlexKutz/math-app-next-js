'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    // Redirect to home when back online
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Режим офлайн
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Ви зараз не в мережі. Доступний збережений вміст.
        </p>
        
        <div className="bg-muted rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">Доступні дії:</h2>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Перегляд збережених уроків</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Виконання завдань без перевірки</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Навігація між розділами</span>
            </li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/math" 
            className="block w-full py-4 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-center shadow-lg hover:shadow-xl"
          >
            📘 Математика
          </Link>
          
          <Link 
            href="/algebra" 
            className="block w-full py-4 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-center shadow-lg hover:shadow-xl"
          >
            ➕ Алгебра
          </Link>
          
          <Link 
            href="/geometry" 
            className="block w-full py-4 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-center shadow-lg hover:shadow-xl"
          >
            🔺 Геометрія
          </Link>
          
          <Link 
            href="/physics" 
            className="block w-full py-4 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-center shadow-lg hover:shadow-xl"
          >
            ⚡ Фізика
          </Link>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 px-6 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 transition-colors mt-6 shadow-md hover:shadow-lg"
        >
          🔄 Спробувати знову
        </button>
        
        <div className="mt-8 text-sm text-muted-foreground">
          <p>Підключіться до Інтернету для повного функціоналу</p>
        </div>
      </div>
    </div>
  );
}