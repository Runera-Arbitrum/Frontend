'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  removing?: boolean;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-50/95 border-green-200/80 text-green-800',
  error: 'bg-red-50/95 border-red-200/80 text-red-800',
  info: 'bg-cyan-50/95 border-cyan-200/80 text-cyan-800',
  warning: 'bg-amber-50/95 border-amber-200/80 text-amber-800',
};

const typeIcons: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={18} className="text-green-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  info: <Info size={18} className="text-cyan-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
};

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback((type: ToastType, message: string, duration = DEFAULT_DURATION) => {
    const id = crypto.randomUUID();
    setToasts(prev => {
      const next = [...prev, { id, type, message }];
      if (next.length > MAX_TOASTS) {
        return next.slice(next.length - MAX_TOASTS);
      }
      return next;
    });
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const success = useCallback((msg: string) => toast('success', msg), [toast]);
  const error = useCallback((msg: string) => toast('error', msg), [toast]);
  const info = useCallback((msg: string) => toast('info', msg), [toast]);
  const warning = useCallback((msg: string) => toast('warning', msg), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[60] pointer-events-none">
        <div className="flex flex-col pt-[env(safe-area-inset-top)]">
          {toasts.map(t => (
            <div
              key={t.id}
              className={cn(
                'mx-4 mt-3 px-4 py-3.5 rounded-2xl shadow-soft flex items-start gap-3 border pointer-events-auto',
                t.removing ? 'animate-toast-out' : 'animate-toast-in',
                typeStyles[t.type],
              )}
            >
              <div className="shrink-0 mt-0.5">{typeIcons[t.type]}</div>
              <p className="flex-1 text-[13px] font-medium leading-snug">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 -mr-1 opacity-50 hover:opacity-80 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
