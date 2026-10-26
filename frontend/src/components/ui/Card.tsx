import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return <div className={cn('card', className)} {...props}>{children}</div>;
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return <div className={cn('px-5 py-4 border-b border-navy-100', className)} {...props}>{children}</div>;
}

export function CardContent({ className, children, ...props }: CardProps) {
  return <div className={cn('p-5', className)} {...props}>{children}</div>;
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return <h3 className={cn('text-base font-semibold text-navy-900', className)} {...props}>{children}</h3>;
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return <p className={cn('text-sm text-navy-500', className)} {...props}>{children}</p>;
}
