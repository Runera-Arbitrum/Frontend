// ============================================
// Utility Functions
// ============================================

import { clsx, type ClassValue } from 'clsx';
import type { TierLevel } from './types';
import { XP_PER_LEVEL, TIER_THRESHOLDS } from './constants';

/** Merge Tailwind class names */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Calculate level from XP */
export function calcLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** Calculate tier from level */
export function calcTier(level: number): TierLevel {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (level >= TIER_THRESHOLDS[i].minLevel) {
      return TIER_THRESHOLDS[i].tier;
    }
  }
  return 1;
}

/** XP progress within current level (0-100%) */
export function calcLevelProgress(xp: number): number {
  return (xp % XP_PER_LEVEL);
}

/** Format meters to km string */
export function formatDistance(meters: number): string {
  const m = meters || 0;
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(2)} km`;
}

/** Format seconds to MM:SS pace per km */
export function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

/** Format seconds to HH:MM:SS duration */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Truncate wallet address */
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Format date to readable string */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format relative time (e.g. "2h ago") */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Generate a random device hash (for demo/testing) */
export function generateDeviceHash(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}
