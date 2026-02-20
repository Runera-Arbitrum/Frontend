"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, getRuns, getEvents } from "@/lib/api";
import type { UserProfile, Run } from "@/lib/types";
import {
  truncateAddress,
  formatDistance,
  formatDuration,
  formatPace,
  calcLevelProgress,
  timeAgo,
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
  Award,
  Calendar,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUserAchievements,
  getAchievement,
  type AchievementData,
} from "@/lib/contracts/achievements";
import type { Hex } from "viem";

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

interface AchievementWithEvent extends AchievementData {
  eventIdHex: Hex;
}

interface EventItem {
  eventId: string;
  name: string;
  targetDistanceMeters: number;
  expReward: number;
  startTime: string;
  endTime: string;
  active: boolean;
  userProgress?: {
    distanceCovered: number;
    isEligible: boolean;
    hasJoined: boolean;
    hasClaimed: boolean;
  };
}

export default function HomePage() {
  const { walletAddress } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [achievements, setAchievements] = useState<AchievementWithEvent[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
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
        const [profileRes, runsRes, eventsRes] = await Promise.allSettled([
          getProfile(walletAddress),
          getRuns(walletAddress),
          getEvents(walletAddress),
        ]);

        if (profileRes.status === "fulfilled") {
          setUser(profileRes.value);
        }
        if (runsRes.status === "fulfilled") {
          setRuns(runsRes.value.runs || []);
        }
        if (eventsRes.status === "fulfilled") {
          setEvents(eventsRes.value.events || []);
        }

        try {
          const addr = walletAddress as `0x${string}`;
          const eventIds = await getUserAchievements(addr);
          if (eventIds.length > 0) {
            const achData = await Promise.all(
              eventIds.map(async (eid) => {
                const data = await getAchievement(addr, eid);
                return data ? { ...data, eventIdHex: eid } : null;
              }),
            );
            setAchievements(achData.filter(Boolean) as AchievementWithEvent[]);
          }
        } catch (scErr) {
          console.error("Failed to fetch achievements from SC:", scErr);
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

  const levelProgress = user?.exp ? calcLevelProgress(user.exp) : 0;
  const streakCalendar = getStreakCalendar(runs);
  const currentStreak = calculateCurrentStreak(runs);

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

  const displayUser = {
    exp: user?.exp ?? 0,
    level: user?.level ?? 1,
    tier: (user?.tier ?? 1) as TierLevel,
    totalDistanceMeters: user?.totalDistanceMeters ?? 0,
    verifiedRunCount: user?.verifiedRunCount ?? 0,
    longestStreakDays: user?.longestStreakDays ?? 0,
    profileTokenId: user?.profileTokenId ?? null,
  };

  return (
    <div className="page-enter">
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
        {/* Hero Streak Section */}
        <div className="px-5 mt-5">
          <div className="relative overflow-hidden rounded-[32px] bg-white border border-border-light shadow-card p-6 text-center">
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 to-transparent" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="streak-pulse mb-4 p-5 bg-primary/10 rounded-full">
                <Flame size={32} className="text-primary" fill="currentColor" />
              </div>

              <h2 className="text-6xl font-bold text-text-primary tracking-tight mb-1">
                {currentStreak}
              </h2>
              <p className="text-lg font-semibold text-text-primary">
                Week Streak
              </p>
              <p className="text-sm text-text-tertiary mb-6">
                You are doing really great!
              </p>

              {/* Weekly Indicators */}
              <div className="flex items-center justify-center gap-2.5">
                {(() => {
                  const today = new Date();
                  const days = [];
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    days.push(d);
                  }
                  return days.map((date, idx) => {
                    const isToday = idx === 6;
                    const dateStr = date.toISOString().split("T")[0];
                    const hasRun = runs.some(
                      (r) =>
                        r.status === "VERIFIED" &&
                        new Date(r.startTime).toISOString().split("T")[0] ===
                          dateStr,
                    );
                    const dayLetter = date.toLocaleDateString("en-US", {
                      weekday: "narrow",
                    });

                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <span className="text-[10px] text-text-tertiary font-medium">
                          {dayLetter}
                        </span>
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-300",
                            hasRun
                              ? "bg-primary text-white shadow-gentle scale-105"
                              : isToday
                                ? "bg-surface-tertiary border border-primary/30 text-text-primary"
                                : "bg-surface-tertiary text-text-tertiary/40",
                          )}
                        >
                          {hasRun ? (
                            <Check size={14} strokeWidth={3} />
                          ) : (
                            date.getDate()
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bento Grid */}
        <div className="px-5 mt-5 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {/* Total Distance */}
            <div className="rounded-3xl bg-surface border border-border-light p-4 shadow-card">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3">
                <MapPin size={20} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {formatDistance(displayUser.totalDistanceMeters)}
              </p>
              <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mt-0.5">
                Total Distance
              </p>
            </div>

            {/* Level Progress */}
            <div className="rounded-3xl bg-surface border border-border-light p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <TierBadge
                    tier={displayUser.tier as TierLevel}
                    className="scale-75"
                  />
                </div>
                <span className="text-xs font-bold text-primary">
                  Lvl {displayUser.level}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-text-tertiary">
                  <span>XP</span>
                  <span>
                    {displayUser.exp % XP_PER_LEVEL}/{XP_PER_LEVEL}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 rounded-3xl bg-surface border border-border-light/70 shadow-card overflow-hidden">
              <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">
                  Latest Run
                </span>
                <button className="text-[11px] text-primary font-medium flex items-center gap-0.5 cursor-pointer">
                  All runs <ChevronRight size={12} />
                </button>
              </div>
              {runs.length === 0 ? (
                <div className="px-4 pb-4 text-center">
                  <p className="text-xs text-text-tertiary py-4">
                    No runs yet. Start running!
                  </p>
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
                            {formatDuration(run.durationSeconds)} ·{" "}
                            {formatPace(run.avgPaceSeconds)}
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
      </div>

      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-primary" />
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Achievements
            </span>
          </div>
          <span className="text-[11px] text-text-tertiary">
            {achievements.length} earned
          </span>
        </div>
        {achievements.length === 0 ? (
          <div className="rounded-2xl bg-surface border border-border-light/70 p-5 text-center shadow-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2.5">
              <Trophy size={22} className="text-primary/60" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-0.5">
              No achievements yet
            </p>
            <p className="text-[11px] text-text-tertiary">
              Complete events to earn badges!
            </p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {achievements.map((ach, idx) => {
              const tierLabels = [
                "",
                "Bronze",
                "Silver",
                "Gold",
                "Platinum",
                "Diamond",
              ];
              const tierColors = [
                "",
                "#CD7F32",
                "#C0C0C0",
                "#FFD700",
                "#E5E4E2",
                "#B9F2FF",
              ];
              const tierGradients = [
                "",
                "from-amber-600/15 to-amber-400/5",
                "from-gray-400/15 to-gray-300/5",
                "from-yellow-500/15 to-yellow-400/5",
                "from-slate-300/15 to-slate-200/5",
                "from-cyan-400/15 to-cyan-300/5",
              ];
              const t = ach.tier >= 1 && ach.tier <= 5 ? ach.tier : 1;
              const unlockDate = new Date(Number(ach.unlockedAt) * 1000);

              return (
                <div
                  key={ach.eventIdHex}
                  className={cn(
                    "stagger-item flex-shrink-0 w-[140px] rounded-2xl border p-3.5 shadow-card",
                    `bg-gradient-to-br ${tierGradients[t]} border-border-light/60`,
                  )}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5 mx-auto"
                    style={{ background: `${tierColors[t]}22` }}
                  >
                    <Award size={20} style={{ color: tierColors[t] }} />
                  </div>
                  <p className="text-[11px] font-semibold text-text-primary text-center truncate">
                    Tier {t} — {tierLabels[t]}
                  </p>
                  <p className="text-[10px] text-text-tertiary text-center mt-0.5">
                    {unlockDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Active Events
            </span>
          </div>
          <a
            href="/events"
            className="text-[11px] text-primary font-medium flex items-center gap-0.5 cursor-pointer"
          >
            View all <ChevronRight size={12} />
          </a>
        </div>
        {events.filter((e) => e.active).length === 0 ? (
          <div className="rounded-2xl bg-surface border border-border-light/70 p-5 text-center shadow-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2.5">
              <Calendar size={22} className="text-primary/60" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-0.5">
              No active events
            </p>
            <p className="text-[11px] text-text-tertiary">
              Check back soon for new challenges!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {events
              .filter((e) => e.active)
              .slice(0, 2)
              .map((evt, idx) => {
                const end = new Date(evt.endTime);
                const now = new Date();
                const daysLeft = Math.max(
                  0,
                  Math.ceil((end.getTime() - now.getTime()) / 86400000),
                );
                const progress = evt.userProgress
                  ? Math.min(
                      100,
                      Math.round(
                        (evt.userProgress.distanceCovered /
                          evt.targetDistanceMeters) *
                          100,
                      ),
                    )
                  : 0;

                return (
                  <div
                    key={evt.eventId}
                    className="stagger-item rounded-2xl bg-surface border border-border-light/70 p-4 shadow-card"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {evt.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                            <Target size={11} />{" "}
                            {formatDistance(evt.targetDistanceMeters)}
                          </span>
                          <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                            <Zap size={11} /> {evt.expReward} XP
                          </span>
                          <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                            <Clock size={11} /> {daysLeft}d left
                          </span>
                        </div>
                      </div>
                      {evt.userProgress?.hasJoined ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                          Joined
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Open
                        </span>
                      )}
                    </div>
                    {evt.userProgress?.hasJoined && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-text-tertiary">
                            {progress}%
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {formatDistance(evt.userProgress.distanceCovered)} /{" "}
                            {formatDistance(evt.targetDistanceMeters)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-primary-100/60 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-700"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="px-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Activity Feed
            </span>
          </div>
          <span className="text-[11px] text-text-tertiary">
            {runs.length} total runs
          </span>
        </div>
        {runs.length === 0 ? (
          <div className="rounded-2xl bg-surface border border-border-light/70 p-5 text-center shadow-card">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2.5">
              <TrendingUp size={22} className="text-primary/60" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-0.5">
              No activity yet
            </p>
            <p className="text-[11px] text-text-tertiary">
              Start running to see your activity here!
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface border border-border-light/70 shadow-card overflow-hidden">
            {runs.slice(0, 10).map((run, idx) => (
              <div
                key={run.id}
                className="stagger-item flex items-center justify-between px-4 py-3 border-b border-border-light/40 last:border-b-0"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <TrendingUp size={15} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {formatDistance(run.distanceMeters)}
                    </p>
                    <p className="text-[11px] text-text-tertiary">
                      {formatDuration(run.durationSeconds)} ·{" "}
                      {formatPace(run.avgPaceSeconds)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <StatusBadge status={run.status} />
                  <span className="text-[10px] text-text-tertiary">
                    {timeAgo(run.startTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        title="Your Streak"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="text-center">
              <div className="streak-pulse w-14 h-14 rounded-full bg-gradient-to-br from-primary/15 to-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <Flame
                  size={28}
                  className="text-primary"
                  fill="currentColor"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                {currentStreak}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">Current</p>
            </div>
            <div className="w-px h-12 bg-border-light" />
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/15 to-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <Trophy size={24} className="text-primary/70" />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-primary/80 to-blue-500 bg-clip-text text-transparent">
                {displayUser.longestStreakDays}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">Longest</p>
            </div>
          </div>

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
                      ? "bg-gradient-to-br from-primary to-blue-500 text-white shadow-sm"
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
                <div className="w-3 h-3 rounded bg-gradient-to-br from-primary to-blue-500" />
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

          <div className="bg-surface-tertiary/50 rounded-2xl p-4">
            <p className="text-xs font-medium text-text-secondary mb-2">
              This Week
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-primary font-semibold">
                {streakCalendar.slice(-7).filter((d) => d.hasRun).length} / 7
                days
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
