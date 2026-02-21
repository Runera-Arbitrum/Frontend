'use client';

import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIER_NAMES, TIER_COLORS, type TierLevel } from '@/lib/types';

const TIER_GRADIENTS: Record<number, string> = {
  1: 'from-amber-600/15 to-amber-400/5',
  2: 'from-gray-400/15 to-gray-300/5',
  3: 'from-yellow-500/15 to-yellow-400/5',
  4: 'from-slate-300/15 to-slate-200/5',
  5: 'from-cyan-400/15 to-cyan-300/5',
};

interface AchievementBadgeProps {
  tier: number;
  unlockedAt: bigint;
  eventIdHex: string;
  variant?: 'compact' | 'full';
  className?: string;
  animationDelay?: number;
}

function formatUnlockDate(unlockedAt: bigint, includeYear?: boolean): string {
  const date = new Date(Number(unlockedAt) * 1000);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  };
  return date.toLocaleDateString('en-US', options);
}

export default function AchievementBadge({
  tier,
  unlockedAt,
  eventIdHex,
  variant = 'compact',
  className,
  animationDelay = 0,
}: AchievementBadgeProps) {
  const t = (tier >= 1 && tier <= 5 ? tier : 1) as TierLevel;
  const color = TIER_COLORS[t];
  const gradient = TIER_GRADIENTS[t];
  const label = TIER_NAMES[t];

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'stagger-item flex-shrink-0 w-[140px] rounded-2xl border p-3.5 shadow-card',
          `bg-gradient-to-br ${gradient} border-border-light/60`,
          className,
        )}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5 mx-auto"
          style={{ background: `${color}22` }}
        >
          <Award size={20} style={{ color }} />
        </div>
        <p className="text-[11px] font-semibold text-text-primary text-center truncate">
          Tier {t} — {label}
        </p>
        <p className="text-[10px] text-text-tertiary text-center mt-0.5">
          {formatUnlockDate(unlockedAt)}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'stagger-item rounded-2xl border p-4 shadow-card flex items-center gap-4',
        `bg-gradient-to-br ${gradient} border-border-light/60`,
        className,
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${color}22` }}
      >
        <Award size={24} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">
          Tier {t} — {label}
        </p>
        <p className="text-[11px] text-text-tertiary mt-0.5">
          Unlocked {formatUnlockDate(unlockedAt, true)}
        </p>
      </div>
    </div>
  );
}
