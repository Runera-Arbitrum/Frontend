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
import { TierBadge, StatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Image from "next/image";
import {
  MapPin,
  TrendingUp,
  Flame,
  Trophy,
  ChevronRight,
  Zap,
  Check,
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
  const [showStreakModal, setShowStreakModal] = useState(false);

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
      <div className="bg-gentle-gradient px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/runera-biru.png"
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
      </div>

      {/* Bento Grid */}
      <div className="px-5 mt-5 mb-6">
        <div className="grid grid-cols-2 gap-3">

          {/* Streak — tall card, spans 2 rows */}
          <button
            onClick={() => setShowStreakModal(true)}
            className="text-left row-span-2"
          >
            <div className="h-full rounded-3xl bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-yellow-500/10 border border-orange-500/15 p-4 flex flex-col justify-between shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flame-glow w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/15 flex items-center justify-center mb-3">
                  <Flame size={20} className="text-orange-500 flame-animated" fill="currentColor" strokeWidth={1.5} />
                </div>
                <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">
                  Current Streak
                </p>
              </div>
              <div className="relative">
                <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  {currentStreak}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">days</p>
              </div>
            </div>
          </button>

          {/* Total Distance */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/15 p-4 shadow-card">
            <MapPin size={18} className="text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {formatDistance(displayUser.totalDistanceMeters)}
            </p>
            <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mt-0.5">
              Total Distance
            </p>
          </div>

          {/* Verified Runs */}
          <div className="rounded-3xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/15 p-4 shadow-card">
            <Zap size={18} className="text-green-500 mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {displayUser.verifiedRunCount}
            </p>
            <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mt-0.5">
              Verified Runs
            </p>
          </div>

          {/* Level / XP — full width */}
          <div className="col-span-2 rounded-3xl bg-gradient-to-r from-primary/8 via-primary-light/6 to-blue-400/8 border border-primary/12 p-4 shadow-card">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <TierBadge tier={displayUser.tier as TierLevel} />
                <span className="text-sm font-semibold text-text-primary">
                  Level {displayUser.level}
                </span>
              </div>
              <span className="text-xs text-text-tertiary">
                {displayUser.exp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-primary-100/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-700 ease-out"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>

          {/* Collectibles */}
          <div className="rounded-3xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/15 p-4 shadow-card">
            <Trophy size={18} className="text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {user?.profileTokenId ? "1" : "0"}
            </p>
            <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mt-0.5">
              Collectibles
            </p>
          </div>

          {/* Best Streak */}
          <div className="rounded-3xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/15 p-4 shadow-card">
            <Flame size={18} className="text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {displayUser.longestStreakDays}
            </p>
            <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mt-0.5">
              Best Streak
            </p>
          </div>

          {/* Latest Run — full width */}
          <div className="col-span-2 rounded-3xl bg-surface border border-border-light/70 shadow-card overflow-hidden">
            <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">Latest Run</span>
              <button className="text-[11px] text-primary font-medium flex items-center gap-0.5">
                All runs <ChevronRight size={12} />
              </button>
            </div>
            {runs.length === 0 ? (
              <div className="px-4 pb-4 text-center">
                <p className="text-xs text-text-tertiary py-4">No runs yet. Start running!</p>
              </div>
            ) : (
              <div className="px-4 pb-3.5">
                {runs.slice(0, 2).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between py-2.5 border-t border-border-light/50 first:border-t-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <TrendingUp size={15} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {formatDistance(run.distanceMeters)}
                        </p>
                        <p className="text-[11px] text-text-tertiary">
                          {formatDuration(run.durationSeconds)} · {formatPace(run.avgPaceSeconds)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Streak Detail Modal */}
      <Modal
        open={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        title="Your Streak"
      >
        <div className="space-y-5">
          {/* Current vs Longest */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="text-center">
              <div className="flame-glow w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/15 flex items-center justify-center mx-auto mb-2">
                <Flame
                  size={28}
                  className="text-orange-500 flame-animated"
                  fill="currentColor"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                {currentStreak}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">Current</p>
            </div>
            <div className="w-px h-12 bg-border-light" />
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center mx-auto mb-2">
                <Trophy size={24} className="text-yellow-500" />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                {displayUser.longestStreakDays}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">Longest</p>
            </div>
          </div>

          {/* 28-day calendar */}
          <div>
            <p className="text-[11px] text-text-tertiary font-medium mb-2 uppercase tracking-wide">
              Last 4 Weeks
            </p>
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                <div
                  key={idx}
                  className="text-center text-[10px] text-text-tertiary font-medium"
                >
                  {day}
                </div>
              ))}
            </div>
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
                <span className="text-[10px] text-text-tertiary">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-surface-tertiary" />
                <span className="text-[10px] text-text-tertiary">Missed</span>
              </div>
            </div>
          </div>

          {/* Weekly summary */}
          <div className="bg-surface-tertiary/50 rounded-2xl p-4">
            <p className="text-xs font-medium text-text-secondary mb-2">This Week</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-primary font-semibold">
                {streakCalendar.slice(-7).filter((d) => d.hasRun).length} / 7 days
              </p>
              <p className="text-xs text-text-tertiary">
                {streakCalendar.slice(-7).filter((d) => d.hasRun).length >= 5
                  ? "Amazing week!"
                  : streakCalendar.slice(-7).filter((d) => d.hasRun).length >= 3
                    ? "Good progress!"
                    : "Keep going!"}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
