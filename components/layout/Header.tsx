'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  transparent?: boolean;
  className?: string;
}

export default function Header({
  title,
  subtitle,
  left,
  right,
  transparent = false,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 px-5 pt-4 pb-2',
        transparent ? 'bg-transparent' : 'bg-surface/85 backdrop-blur-xl border-b border-border-light/50',
        className,
      )}
    >
      <div className="flex items-center justify-between h-10">
        <div className="w-10 flex items-center justify-start">
          {left}
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-[15px] font-semibold text-text-primary leading-tight tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-[11px] text-text-tertiary mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="w-10 flex items-center justify-end">
          {right}
        </div>
      </div>
    </header>
  );
}
