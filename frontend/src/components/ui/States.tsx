import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-navy-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-navy-400" />
      </div>
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-navy-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
      </div>
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-navy-500 max-w-sm">{description}</p>}
      {onRetry && <button onClick={onRetry} className="btn-primary mt-4">Try Again</button>}
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-navy-100', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <LoadingSkeleton className="w-20 h-20 rounded-xl" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton className="h-4 w-3/4" />
          <LoadingSkeleton className="h-3 w-1/2" />
          <LoadingSkeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <LoadingSkeleton className="h-8 flex-1" />
        <LoadingSkeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

export function PageSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
