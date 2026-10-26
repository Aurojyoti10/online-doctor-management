import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'primary' | 'teal' | 'navy';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = 'navy', children, dot = false, className }: BadgeProps) {
  return (
    <span className={cn(`badge-${variant}`, className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    confirmed: { label: 'Confirmed', variant: 'success' },
    completed: { label: 'Completed', variant: 'primary' },
    pending: { label: 'Pending', variant: 'warning' },
    cancelled: { label: 'Cancelled', variant: 'error' },
    rejected: { label: 'Rejected', variant: 'error' },
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'navy' },
    paid: { label: 'Paid', variant: 'success' },
    refunded: { label: 'Refunded', variant: 'navy' },
    failed: { label: 'Failed', variant: 'error' },
    online: { label: 'Online', variant: 'teal' },
    'in-person': { label: 'In-person', variant: 'primary' },
  };
  const item = config[status] ?? { label: status, variant: 'navy' as BadgeVariant };
  return <Badge variant={item.variant} dot>{item.label}</Badge>;
}
