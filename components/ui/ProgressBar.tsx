'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const colorStyles = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium text-text-secondary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-surface-tertiary overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colorStyles[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
