import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({ open, onClose, title, description, children, size = 'md', showClose = true }: ModalProps) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full bg-white rounded-2xl shadow-elevated animate-slide-up max-h-[90vh] flex flex-col', sizes[size])}>
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-navy-100">
            <div>
              {title && <h2 className="text-lg font-semibold text-navy-900">{title}</h2>}
              {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
            </div>
            {showClose && <button onClick={onClose} className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors" aria-label="Close dialog"><X className="w-5 h-5" /></button>}
          </div>
        )}
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', variant = 'danger' }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-6">
        <p className="text-sm text-navy-600 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={onConfirm} className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
