'use client'; // Обязательно для App Router в Next.js
import { useState, useEffect } from 'react';

const DebugGrid = () => {
  // 1. Сразу проверяем, продакшн ли это.
  // Если да — возвращаем null. Next.js вырежет этот код при сборке.
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Например: Shift + D
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsEnabled((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isEnabled) return null;

  // 2. Глобальные стили, которые применяются ко ВСЕМ элементам
  return (
    <style jsx global>{`
      * {
        outline: 1px solid rgba(255, 0, 0, 0.5) !important;
        /* Добавляем полупрозрачный фон для наглядности вложенности */
        background: rgba(255, 0, 0, 0.02) !important;
      }
    `}</style>
  );
};

export default DebugGrid;