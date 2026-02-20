'use client';

import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-text-inverse hover:bg-primary-dark active:scale-[0.96] active:opacity-90 shadow-gentle ios-press',
  secondary: 'bg-primary-50 text-primary hover:bg-primary-100 active:scale-[0.96] active:bg-primary-200 ios-press',
  outline: 'border border-border text-text-secondary hover:bg-surface-tertiary active:scale-[0.97] active:bg-border-light ios-press',
  ghost: 'text-text-secondary hover:bg-surface-tertiary active:scale-[0.97] active:bg-border-light ios-press',
  danger: 'bg-error/90 text-text-inverse hover:bg-error active:scale-[0.96] active:opacity-90 ios-press',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-11 px-4 text-xs gap-1.5 rounded-xl min-w-[88px]',
  md: 'h-11 px-6 text-sm gap-2 rounded-xl min-w-[100px]',
  lg: 'h-12 px-7 text-[15px] gap-2.5 rounded-2xl min-w-[120px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out cursor-pointer',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
