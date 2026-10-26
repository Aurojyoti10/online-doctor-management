import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  color?: 'primary' | 'teal' | 'success' | 'warning' | 'error';
}

export function StatCard({ label, value, icon: Icon, trend, color = 'primary' }: StatCardProps) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    teal: 'bg-teal-50 text-teal-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trend.up ? 'text-success-600' : 'text-error-600')}>
            {trend.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-navy-900 mt-3">{value}</p>
      <p className="text-sm text-navy-500 mt-0.5">{label}</p>
    </Card>
  );
}
