'use client';

import { useAuth } from '@/hooks/useAuth';
import { MOCK_USER, MOCK_RUNS, MOCK_WEEKLY_DISTANCES } from '@/lib/mock-data';
import { truncateAddress, formatDistance, formatDuration, formatPace, calcLevelProgress } from '@/lib/utils';
import { TIER_NAMES, type TierLevel } from '@/lib/types';
import { XP_PER_LEVEL } from '@/lib/constants';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import { TierBadge, StatusBadge } from '@/components/ui/Badge';
import Image from 'next/image';
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
      {/* Hero Section — soft, warm, not aggressive */}
      <div className="bg-gentle-gradient px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Image
              src="/runera biru.png"
              alt="Runera"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <div>
              <p className="text-xs text-text-tertiary">Welcome back</p>
              <p className="text-[15px] font-semibold text-text-primary">
                {walletAddress ? truncateAddress(walletAddress) : 'Runner'}
              </p>
            </div>
          </div>
          <TierBadge tier={user.tier} />
        </div>

        {/* Level Progress — gentle card */}
        <Card className="!border-primary-100/50 !bg-primary-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-medium">Level {user.level}</span>
            <span className="text-text-tertiary text-xs">{user.exp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP</span>
          </div>
          <div className="w-full h-2 rounded-full bg-primary-100/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/70 transition-all duration-700 ease-out"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-text-primary text-xl font-semibold">{user.exp} XP</span>
            <span className="text-text-tertiary text-xs">
              Next: {TIER_NAMES[Math.min(user.tier + 1, 5) as TierLevel]}
            </span>
          </div>
        </Card>
      </div>

      {/* Quick Stats — soft grid */}
      <div className="px-5 mt-5">
        <div className="grid grid-cols-4 gap-2.5">
          <StatMini icon={<MapPin size={16} />} value={formatDistance(user.totalDistanceMeters)} label="Distance" />
          <StatMini icon={<Zap size={16} />} value={String(user.verifiedRunCount)} label="Runs" />
          <StatMini icon={<Flame size={16} />} value={`${user.longestStreakDays}d`} label="Streak" />
          <StatMini icon={<Trophy size={16} />} value="1" label="NFTs" />
        </div>
      </div>

      {/* Weekly Activity — clean chart */}
      <div className="px-5 mt-5">
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
            <span className="text-xs text-text-tertiary">
              {formatDistance(weekly.reduce((s, d) => s + d.meters, 0))} total
            </span>
          </CardHeader>
          <div className="flex items-end justify-between gap-1.5 h-24">
            {weekly.map((day) => (
              <div key={day.day} className="flex flex-col items-center flex-1 gap-1.5">
                <div className="w-full flex items-end justify-center h-16">
                  <div
                    className="w-full max-w-[22px] rounded-lg transition-all duration-500 ease-out"
                    style={{
                      height: `${Math.max((day.meters / maxWeekly) * 100, 6)}%`,
                      backgroundColor: day.meters > 0 ? 'var(--color-primary)' : 'var(--color-surface-tertiary)',
                      opacity: day.meters > 0 ? 0.7 : 1,
                    }}
                  />
                </div>
                <span className="text-[10px] text-text-tertiary font-medium">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Runs — clean list */}
      <div className="px-5 mt-5 mb-6">
        <Card padding="none">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <CardTitle>Recent Runs</CardTitle>
            <button className="text-xs text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-border-light/60">
            {runs.slice(0, 3).map((run) => (
              <div key={run.id} className="px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50/60 flex items-center justify-center">
                    <TrendingUp size={17} className="text-primary/70" />
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
    <Card className="flex flex-col items-center py-3 px-1 text-center !border-border-light/50">
      <span className="text-primary/60 mb-1.5">{icon}</span>
      <span className="text-sm font-semibold text-text-primary">{value}</span>
      <span className="text-[10px] text-text-tertiary mt-0.5">{label}</span>
    </Card>
  );
}
