'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      <div className="mb-4 text-text-tertiary">{icon}</div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}
      {action}
    </div>
  );
}
