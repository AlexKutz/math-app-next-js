'use client';

import React, { useState, ReactNode, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
}

const Tooltip = ({ content, children, delay = 100 }: TooltipProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const showTimeout = useRef<NodeJS.Timeout | null>(null);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    showTimeout.current = setTimeout(() => {
      setIsMounted(true);
      requestAnimationFrame(() => setIsVisible(true));
    }, delay);
  };

  const hideTooltip = () => {
    if (showTimeout.current) clearTimeout(showTimeout.current);

    setIsVisible(false);
    hideTimeout.current = setTimeout(() => {
      setIsMounted(false);
    }, 100);
  };

  return children;

  return (
    <div
      className='relative inline-flex'
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isMounted && (
        <div
          role='tooltip'
          className='pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2'
        >
          <div
            className={`transition-all duration-100 ease-out ${
              isVisible ? 'opacity-80' : 'opacity-80'
            } `}
          >
            <div className='mx-auto h-2 w-2 translate-y-2 rotate-45 bg-gray-800 dark:bg-gray-200' />

            <div className='mt-1 rounded-lg bg-gray-800 px-4 py-2 text-sm whitespace-nowrap text-gray-200 shadow-lg dark:bg-gray-200 dark:text-gray-900'>
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
