'use client';

import { useAuth } from '@/hooks/useAuth';
import { MOCK_USER, MOCK_RUNS, MOCK_WEEKLY_DISTANCES } from '@/lib/mock-data';
import { truncateAddress, formatDistance, formatDuration, formatPace, calcLevelProgress } from '@/lib/utils';
import { TIER_NAMES, type TierLevel } from '@/lib/types';
import { XP_PER_LEVEL } from '@/lib/constants';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import { TierBadge, StatusBadge } from '@/components/ui/Badge';
import { MapPin, TrendingUp, Flame, Trophy, ChevronRight, Zap } from 'lucide-react';

export default function HomePage() {
  const { walletAddress } = useAuth();
  const user = MOCK_USER;
  const runs = MOCK_RUNS;
  const weekly = MOCK_WEEKLY_DISTANCES;

  const maxWeekly = Math.max(...weekly.map((d) => d.meters), 1);
  const levelProgress = calcLevelProgress(user.exp);

  return (
    <div className="page-enter">
      {/* Hero Section */}
      <div className="bg-primary px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-200 text-xs font-medium">Welcome back</p>
            <p className="text-text-inverse text-lg font-bold">
              {walletAddress ? truncateAddress(walletAddress) : 'Runner'}
            </p>
          </div>
          <TierBadge tier={user.tier} />
        </div>

        {/* Level Progress */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-primary-100 text-xs">Level {user.level}</span>
            <span className="text-primary-100 text-xs">{user.exp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-text-inverse text-2xl font-bold">{user.exp} XP</span>
            <span className="text-primary-200 text-xs">
              Next: {TIER_NAMES[Math.min(user.tier + 1, 5) as TierLevel]}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-4 gap-2">
          <StatMini icon={<MapPin size={16} />} value={formatDistance(user.totalDistanceMeters)} label="Distance" />
          <StatMini icon={<Zap size={16} />} value={String(user.verifiedRunCount)} label="Runs" />
          <StatMini icon={<Flame size={16} />} value={`${user.longestStreakDays}d`} label="Streak" />
          <StatMini icon={<Trophy size={16} />} value="1" label="NFTs" />
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="px-4 mt-5">
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
            <span className="text-xs text-text-tertiary">
              {formatDistance(weekly.reduce((s, d) => s + d.meters, 0))} total
            </span>
          </CardHeader>
          <div className="flex items-end justify-between gap-1 h-24">
            {weekly.map((day) => (
              <div key={day.day} className="flex flex-col items-center flex-1 gap-1">
                <div className="w-full flex items-end justify-center h-16">
                  <div
                    className="w-full max-w-[24px] rounded-t-md transition-all duration-300"
                    style={{
                      height: `${Math.max((day.meters / maxWeekly) * 100, 4)}%`,
                      backgroundColor: day.meters > 0 ? 'var(--color-primary)' : 'var(--color-surface-tertiary)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-text-tertiary">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Runs */}
      <div className="px-4 mt-5 mb-4">
        <Card padding="none">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <CardTitle>Recent Runs</CardTitle>
            <button className="text-xs text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-border-light">
            {runs.slice(0, 3).map((run) => (
              <div key={run.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <TrendingUp size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {formatDistance(run.distanceMeters)}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {formatDuration(run.durationSeconds)} · {formatPace(run.avgPaceSeconds)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={run.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatMini({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card className="flex flex-col items-center py-3 px-1 text-center">
      <span className="text-primary mb-1">{icon}</span>
      <span className="text-sm font-bold text-text-primary">{value}</span>
      <span className="text-[10px] text-text-tertiary">{label}</span>
    </Card>
  );
}
