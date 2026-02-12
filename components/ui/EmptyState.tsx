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
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      <div className="mb-5 text-text-tertiary/60">{icon}</div>
      <h3 className="text-[15px] font-medium text-text-secondary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-tertiary mb-5 leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}
