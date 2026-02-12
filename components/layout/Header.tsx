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
        'sticky top-0 z-30 px-4 pt-3 pb-2',
        transparent ? 'bg-transparent' : 'bg-surface/80 backdrop-blur-lg border-b border-border-light',
        className,
      )}
    >
      <div className="flex items-center justify-between h-10">
        {/* Left slot */}
        <div className="w-10 flex items-center justify-start">
          {left}
        </div>

        {/* Center */}
        <div className="flex-1 text-center">
          <h1 className="text-base font-bold text-text-primary leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-[10px] text-text-tertiary">{subtitle}</p>
          )}
        </div>

        {/* Right slot */}
        <div className="w-10 flex items-center justify-end">
          {right}
        </div>
      </div>
    </header>
  );
}
