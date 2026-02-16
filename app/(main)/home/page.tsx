"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, getRuns } from "@/lib/api";
import type { UserProfile, Run } from "@/lib/types";
import {
  truncateAddress,
  formatDistance,
  formatDuration,
  formatPace,
  calcLevelProgress,
} from "@/lib/utils";
import { TIER_NAMES, type TierLevel } from "@/lib/types";
import { XP_PER_LEVEL } from "@/lib/constants";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import { TierBadge, StatusBadge } from "@/components/ui/Badge";
import Image from "next/image";
import {
  MapPin,
  TrendingUp,
  Flame,
  Trophy,
  ChevronRight,
  Zap,
  Check,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Generate streak calendar from run history
const getStreakCalendar = (runs: Run[]) => {
  const today = new Date();
  const calendar = [];

  for (let i = 27; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Check if user had a verified run on this day
    const hasRun = runs.some((run) => {
      const runDate = new Date(run.startTime).toISOString().split("T")[0];
      return runDate === dateStr && run.status === "VERIFIED";
    });

    calendar.push({
      date: date.getDate(),
      hasRun,
      isToday: i === 0,
    });
  }

  return calendar;
};

// Calculate weekly distances from run data
const getWeeklyDistances = (runs: Run[]) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyData = days.map((day) => ({ day, meters: 0 }));

  runs.forEach((run) => {
    if (run.status !== "VERIFIED") return;
    const runDate = new Date(run.startTime);
    if (runDate >= startOfWeek) {
      const dayIndex = runDate.getDay();
      weeklyData[dayIndex].meters += run.distanceMeters;
    }
  });

  return weeklyData;
};

// Calculate current streak from runs
const calculateCurrentStreak = (runs: Run[]): number => {
  const verifiedRuns = runs
    .filter((r) => r.status === "VERIFIED")
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

  if (verifiedRuns.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    const hasRun = verifiedRuns.some((run) => {
      return new Date(run.startTime).toISOString().split("T")[0] === dateStr;
    });

    if (hasRun) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
};

export default function HomePage() {
  const { walletAddress } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [profileRes, runsRes] = await Promise.allSettled([
          getProfile(walletAddress),
          getRuns(walletAddress),
        ]);

        if (profileRes.status === "fulfilled") {
          setUser(profileRes.value);
        }
        if (runsRes.status === "fulfilled") {
          setRuns(runsRes.value.runs || []);
        }
      } catch (err) {
        console.error("Failed to fetch home data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  // Computed values
  const weekly = getWeeklyDistances(runs);
  const maxWeekly = Math.max(...weekly.map((d) => d.meters), 1);
  const levelProgress = user ? calcLevelProgress(user.exp) : 0;
  const streakCalendar = getStreakCalendar(runs);
  const currentStreak = calculateCurrentStreak(runs);

  // Loading state
  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  // Default values if profile not yet created
  const displayUser = user || {
    exp: 0,
    level: 1,
    tier: 1 as TierLevel,
    totalDistanceMeters: 0,
    verifiedRunCount: 0,
    longestStreakDays: 0,
  };

  return (
    <div className="page-enter">
      {/* Hero Section */}
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
                {walletAddress ? truncateAddress(walletAddress) : "Runner"}
              </p>
            </div>
          </div>
          <TierBadge tier={displayUser.tier as TierLevel} />
        </div>

        {/* Level Progress */}
        <Card className="!border-primary-100/50 !bg-primary-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-medium">
              Level {displayUser.level}
            </span>
            <span className="text-text-tertiary text-xs">
              {displayUser.exp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-primary-100/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/70 transition-all duration-700 ease-out"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-text-primary text-xl font-semibold">
              {displayUser.exp} XP
            </span>
            <span className="text-text-tertiary text-xs">
              Next:{" "}
              {
                TIER_NAMES[
                  Math.min((displayUser.tier as number) + 1, 5) as TierLevel
                ]
              }
            </span>
          </div>
        </Card>
      </div>

      {/* 🔥 STREAK MOTIVATION SECTION - PROMINENT */}
      <div className="px-5 mt-5">
        <Card className="!bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-yellow-500/10 !border-orange-500/20 overflow-hidden relative">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={20} className="text-orange-500" />
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    Running Streak
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    {currentStreak}
                  </p>
                  <p className="text-lg font-semibold text-text-secondary mb-1">
                    days
                  </p>
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Longest: {displayUser.longestStreakDays} days 🏆
                </p>
              </div>

              <div className="text-center bg-white/50 rounded-2xl px-3 py-2 backdrop-blur-sm">
                <Calendar size={16} className="text-orange-500 mx-auto mb-1" />
                <p className="text-[10px] text-text-tertiary font-medium">
                  This Month
                </p>
              </div>
            </div>

            {/* Visual Streak Calendar - Last 28 days */}
            <div>
              <p className="text-[11px] text-text-tertiary font-medium mb-2 uppercase tracking-wide">
                Last 4 Weeks
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {streakCalendar.map((day, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-all",
                      day.hasRun
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm"
                        : day.isToday
                          ? "bg-surface-tertiary border-2 border-primary text-text-secondary"
                          : "bg-surface-tertiary text-text-tertiary/40",
                    )}
                  >
                    {day.hasRun ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      <span className="text-[9px]">{day.date}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border-light/30">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-500 to-orange-600" />
                  <span className="text-[10px] text-text-tertiary">
                    Completed
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-surface-tertiary" />
                  <span className="text-[10px] text-text-tertiary">Missed</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats Grid */}
      <div className="px-5 mt-5">
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard
            icon={<MapPin size={18} className="text-blue-500" />}
            value={formatDistance(displayUser.totalDistanceMeters)}
            label="Total Distance"
            gradient="from-blue-500/10 to-blue-600/5"
          />
          <StatCard
            icon={<Zap size={18} className="text-yellow-500" />}
            value={String(displayUser.verifiedRunCount)}
            label="Verified Runs"
            gradient="from-yellow-500/10 to-yellow-600/5"
          />
          <StatCard
            icon={<Trophy size={18} className="text-purple-500" />}
            value={user?.profileTokenId ? "1" : "0"}
            label="NFTs Owned"
            gradient="from-purple-500/10 to-purple-600/5"
          />
        </div>
      </div>

      {/* Weekly Activity Chart */}
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
              <div
                key={day.day}
                className="flex flex-col items-center flex-1 gap-1.5"
              >
                <div className="w-full flex items-end justify-center h-16">
                  <div
                    className={cn(
                      "w-full max-w-[22px] rounded-lg transition-all duration-500 ease-out",
                      day.meters > 0 && "shadow-sm",
                    )}
                    style={{
                      height: `${Math.max((day.meters / maxWeekly) * 100, 6)}%`,
                      background:
                        day.meters > 0
                          ? "linear-gradient(135deg, var(--color-primary) 0%, #0060d4 100%)"
                          : "var(--color-surface-tertiary)",
                    }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    day.meters > 0 ? "text-primary" : "text-text-tertiary",
                  )}
                >
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Runs */}
      <div className="px-5 mt-5 mb-6">
        <Card padding="none">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <CardTitle>Recent Runs</CardTitle>
            <button className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-border-light/60">
            {runs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-text-tertiary">
                  No runs yet. Start running!
                </p>
              </div>
            ) : (
              runs.slice(0, 3).map((run) => (
                <div
                  key={run.id}
                  className="px-4 py-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <TrendingUp size={17} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {formatDistance(run.distanceMeters)}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {formatDuration(run.durationSeconds)} ·{" "}
                        {formatPace(run.avgPaceSeconds)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={run.status} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  gradient,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  gradient: string;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center py-4 text-center !border-border-light/50 !bg-gradient-to-br",
        gradient,
      )}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-base font-bold text-text-primary">{value}</span>
      <span className="text-[10px] text-text-tertiary mt-0.5 leading-tight">
        {label}
      </span>
    </Card>
  );
}
