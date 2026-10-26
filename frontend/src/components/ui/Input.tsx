import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, className, id, ...props }, ref) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <input ref={ref} id={id} className={cn('input', error && 'border-error-500 focus:border-error-500 focus:ring-error-100')} {...props} />
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, className, id, children, ...props }, ref) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <select ref={ref} id={id} className={cn('input appearance-none', error && 'border-error-500')} {...props}>{children}</select>
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, className, id, ...props }, ref) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <textarea ref={ref} id={id} className={cn('input resize-none', error && 'border-error-500')} {...props} />
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
    </div>
  );
});
