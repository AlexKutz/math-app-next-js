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
 * Hook for modal internal logic: animations, ESC key, and click outside
 */
export const useModalLogic = (onClose: () => void) => {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // ESC key and Click Outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
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
