'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export default function Card({
  children,
  padding = 'md',
  hoverable = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-surface border border-border-light',
        'shadow-card',
        hoverable && 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer',
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Sub-components for structured cards
export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold text-text-primary', className)}>
      {children}
    </h3>
  );
}
