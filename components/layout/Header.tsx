'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  transparent?: boolean;
  largeTitle?: boolean;
  className?: string;
}

export default function Header({
  title,
  subtitle,
  left,
  right,
  transparent = false,
  largeTitle = false,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 px-5 ios-header-safe',
        largeTitle ? 'pb-3' : 'pb-2',
        transparent ? 'bg-transparent' : 'glass-ios-header',
        className,
      )}
    >
      <div className="flex items-center justify-between h-11">
        <div className="w-11 flex items-center justify-start ios-touch-44">
          {left}
        </div>

        {!largeTitle && (
          <div className="flex-1 text-center">
            <h1 className="text-[15px] font-semibold text-text-primary leading-tight tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-text-tertiary mt-0.5">{subtitle}</p>
            )}
          </div>
        )}

        <div className="w-11 flex items-center justify-end ios-touch-44">
          {right}
        </div>
      </div>

      {largeTitle && (
        <div className="mt-2">
          <h1 className="ios-large-title text-text-primary">{title}</h1>
          {subtitle && (
            <p className="ios-footnote text-text-tertiary mt-1">{subtitle}</p>
          )}
        </div>
      )}
    </header>
  );
}
