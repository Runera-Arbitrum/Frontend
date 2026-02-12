'use client';

import { cn } from '@/lib/utils';
import { TIER_NAMES, type TierLevel } from '@/lib/types';
import type { ReactNode } from 'react';

// --- Generic Badge ---
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'blue';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-surface-tertiary text-text-secondary',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-cyan-50 text-cyan-700',
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
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

// --- Tier Badge ---
const tierClasses: Record<TierLevel, string> = {
  1: 'tier-bronze text-amber-900',
  2: 'tier-silver text-gray-700',
  3: 'tier-gold text-yellow-900',
  4: 'tier-platinum text-gray-600',
  5: 'tier-diamond text-cyan-800',
};

export function TierBadge({ tier, className }: { tier: TierLevel; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold',
        tierClasses[tier],
        className,
      )}
    >
      {TIER_NAMES[tier]}
    </span>
  );
}

// --- Rarity Badge ---
const rarityClasses: Record<string, string> = {
  COMMON: 'bg-gray-100 text-gray-600',
  RARE: 'bg-blue-50 text-blue-700',
  EPIC: 'bg-purple-50 text-purple-700',
  LEGENDARY: 'bg-amber-50 text-amber-700',
  MYTHIC: 'bg-red-50 text-red-700',
};

export function RarityBadge({ rarity, className }: { rarity: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase',
        rarityClasses[rarity] || rarityClasses.COMMON,
        className,
      )}
    >
      {rarity.toLowerCase()}
    </span>
  );
}

// --- Status Badge ---
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
