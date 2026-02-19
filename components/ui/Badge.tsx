'use client';

import { cn } from '@/lib/utils';
import { TIER_NAMES, type TierLevel } from '@/lib/types';
import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'blue';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-surface-tertiary text-text-secondary',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-amber-50 text-amber-600',
  error: 'bg-red-50 text-red-500',
  info: 'bg-cyan-50 text-cyan-600',
  blue: 'bg-primary-50 text-primary',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

const tierClasses: Record<TierLevel, string> = {
  1: 'tier-bronze text-amber-900/80',
  2: 'tier-silver text-gray-600',
  3: 'tier-gold text-yellow-800/80',
  4: 'tier-platinum text-gray-500',
  5: 'tier-diamond text-cyan-700/80',
};

export function TierBadge({ tier, className }: { tier: TierLevel; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold',
        tierClasses[tier],
        className,
      )}
    >
      {TIER_NAMES[tier]}
    </span>
  );
}

const rarityClasses: Record<string, string> = {
  COMMON: 'bg-gray-50 text-gray-500',
  RARE: 'bg-blue-50 text-blue-500',
  EPIC: 'bg-purple-50 text-purple-500',
  LEGENDARY: 'bg-amber-50 text-amber-600',
  MYTHIC: 'bg-red-50 text-red-500',
};

export function RarityBadge({ rarity, className }: { rarity: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
        rarityClasses[rarity] || rarityClasses.COMMON,
        className,
      )}
    >
      {rarity.charAt(0) + rarity.slice(1).toLowerCase()}
    </span>
  );
}

const statusVariants: Record<string, BadgeVariant> = {
  VERIFIED: 'success',
  SUBMITTED: 'blue',
  VALIDATING: 'warning',
  REJECTED: 'error',
  ONCHAIN_COMMITTED: 'info',
  JOINED: 'blue',
  COMPLETED: 'success',
  ACTIVE: 'success',
  SOLD: 'default',
  CANCELLED: 'error',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={statusVariants[status] || 'default'} className={className}>
      {status.replace('_', ' ').toLowerCase()}
    </Badge>
  );
}
