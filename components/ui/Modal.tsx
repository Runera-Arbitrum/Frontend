'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet style on mobile */}
      <div
        className={cn(
          'relative w-full max-w-[430px] bg-surface rounded-t-3xl sm:rounded-2xl',
          'p-5 pb-8 max-h-[85vh] overflow-y-auto',
          'animate-in slide-in-from-bottom duration-200',
          className,
        )}
      >
        {/* Handle bar (mobile indicator) */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4 sm:hidden" />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-tertiary transition-colors"
            >
              <X size={20} className="text-text-tertiary" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
