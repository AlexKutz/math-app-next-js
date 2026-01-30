'use client';

import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useModalLogic } from '@/lib/hooks/useModal';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxWidth?: string; // e.g., 'max-w-md', 'max-w-lg', 'max-w-2xl'
  showCloseButton?: boolean;
  className?: string;
  align?: 'center' | 'start';
}

export const Modal = ({
  onClose,
  children,
  title,
  maxWidth = 'max-w-md',
  showCloseButton = true,
  className = '',
  align = 'center',
}: ModalProps) => {
  const { isVisible, handleClose, modalRef } = useModalLogic(onClose);

  // Avoid rendering portal on server
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`
        fixed inset-0 z-50 flex justify-center
        bg-black/50 transition-opacity duration-200
        ${align === 'center' ? 'items-center' : 'items-start pt-[10vh]'}
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`
          w-full ${maxWidth} rounded-xl bg-background p-6 relative
          transition-all duration-200 shadow-xl transform-gpu antialiased
          border border-border
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          ${className}
        `}
      >
        {showCloseButton && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {title && (
          <h2 className="text-xl font-bold mb-4 text-foreground">
            {title}
          </h2>
        )}

        <div className="mt-2">{children}</div>
      </div>
    </div>,
    document.body
  );
};
