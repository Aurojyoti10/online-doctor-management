import { Check, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

const toastConfig = {
  success: { icon: Check, classes: 'border-success-200 bg-success-50 text-success-700' },
  error: { icon: XCircle, classes: 'border-error-200 bg-error-50 text-error-700' },
  warning: { icon: AlertTriangle, classes: 'border-warning-200 bg-warning-50 text-warning-700' },
  info: { icon: Info, classes: 'border-primary-200 bg-primary-50 text-primary-700' },
};

export function Toast({ type = 'success', title, message, onClose, duration = 4000 }: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);
  return (
    <div className={cn('flex items-start gap-3 w-full max-w-sm p-4 rounded-xl border shadow-elevated animate-slide-in-right', config.classes)} role="status">
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {message && <p className="mt-0.5 text-xs opacity-80">{message}</p>}
      </div>
      <button onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Close notification"><X className="w-4 h-4" /></button>
    </div>
  );
}

export function ToastViewport({ children }: { children: ReactNode }) {
  return <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 pointer-events-none [&>*]:pointer-events-auto">{children}</div>;
}
