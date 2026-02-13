'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for managing modal open/closed state in the parent component
 */
export const useModalState = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
};

/**
 * Hook for modal internal logic: animations, ESC key, click outside, and scroll lock
 */
export const useModalLogic = (onClose: () => void) => {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef<number>(0);

  // Animate in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Handle closing with animation
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Match transition duration
  }, [onClose]);

  // ESC key, Click Outside, and Scroll Lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    // Disable background scrolling
    const disableScroll = () => {
      // scrollYRef.current = window.scrollY;
      // document.body.style.position = 'fixed';
      // document.body.style.top = `-${scrollYRef.current}px`;
      // document.body.style.left = '0';
      // document.body.style.right = '0';
      document.body.classList.add('noscroll');
      document.documentElement.classList.add('noscroll');
      // document.body.style.width = '100%';
    };

    // Restore background scrolling
    const enableScroll = () => {
      // document.body.style.position = '';
      // document.body.style.top = '';
      // document.body.style.left = '';
      // document.body.style.right = '';
      document.body.classList.remove('noscroll');
      document.documentElement.classList.remove('noscroll');
      // document.body.style.width = '';
      // window.scrollTo(0, scrollYRef.current);
    };

    disableScroll();
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      enableScroll();
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClose]);

  return {
    isVisible,
    handleClose,
    modalRef,
  };
};
