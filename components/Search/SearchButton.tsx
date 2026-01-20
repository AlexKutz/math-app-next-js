'use client';

import { useState, useRef, useEffect } from 'react';
import { IoSearch } from 'react-icons/io5';
import { HeaderButton } from '../HeaderButton';

export const SearchButton = () => {
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsActive(true);
    // Анімація триватиме 1.4 секунди (2 повних цикли по 0.7с)
    timeoutRef.current = setTimeout(() => setIsActive(false), 1400);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes scale-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-scale-pulse {
          animation: scale-pulse 0.7s ease-in-out infinite;
        }
      `}</style>

      <HeaderButton
        onClickHandler={handleClick}
        className={isActive ? 'animate-scale-pulse' : ''}
      >
        <IoSearch
          className={`h-5 w-5 text-gray-500 transition-colors duration-100 dark:text-gray-200 ${
            isActive ? 'text-red-500 dark:text-red-400' : ''
          }`}
        />
      </HeaderButton>
    </>
  );
};
