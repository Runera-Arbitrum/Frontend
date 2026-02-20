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
      {/* Backdrop — softer */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet — gentle */}
      <div
        className={cn(
          'relative w-full max-w-[430px] bg-surface rounded-t-2xl sm:rounded-2xl',
          'p-6 pb-10 max-h-[85vh] overflow-y-auto',
          'animate-in slide-in-from-bottom duration-300',
          className,
        )}
      >
        {/* Handle bar */}
        <div className="w-9 h-1 rounded-full bg-border-light mx-auto mb-5 sm:hidden" />

        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-1 rounded-full hover:bg-surface-tertiary transition-colors duration-200"
            >
              <X size={18} className="text-text-tertiary" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
