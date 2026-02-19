"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, requestFaucet } from "@/lib/api";
import { getRuns } from "@/lib/api";
import { createWalletClient, custom, type Address } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import ProfileNFTABI from "@/lib/contracts/abis/RuneraProfileNFT.json";
import type { UserProfile, Run } from "@/lib/types";
import {
  truncateAddress,
  formatDistance,
  formatDuration,
  formatPace,
  timeAgo,
} from "@/lib/utils";
import { MOCK_ACTIVITY_FEED } from "@/lib/mock-data";
import { TIER_NAMES, type TierLevel } from "@/lib/types";
import { XP_PER_LEVEL } from "@/lib/constants";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { TierBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  User,
  LogOut,
  Copy,
  Check,
  Footprints,
  Flame,
  Trophy,
  Award,
  Settings,
  Droplets,
  Package,
  Shield,
  Calendar,
  Target,
  Zap,
  Loader2,
  MapPin,
} from "lucide-react";

type ProfileTab = "stats" | "feed" | "achievements" | "equipped";

// Generate monthly calendar for streak visualization from real runs
const getMonthlyStreakData = (runs: Run[]) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const calendar: (null | {
    day: number;
    hasRun: boolean;
    isToday: boolean;
    isPast: boolean;
  })[] = [];

  for (let i = 0; i < firstDay; i++) {
    calendar.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isPast = date <= today;
    const dateStr = date.toISOString().split("T")[0];

    const hasRun = runs.some((run) => {
      const runDate = new Date(run.startTime).toISOString().split("T")[0];
      return runDate === dateStr && run.status === "VERIFIED";
    });

    calendar.push({
      day,
      hasRun,
      isToday: day === today.getDate(),
      isPast,
    });
  }

  return {
    monthName: today.toLocaleString("default", { month: "long" }),
    year,
    calendar,
  };
};

export default function ProfilePage() {
  const { walletAddress, activeWallet, walletReady, logout } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("stats");
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [mintLoading, setMintLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
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
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  // Computed values
  const displayUser = user || {
    exp: 0,
    level: 1,
    tier: 1 as TierLevel,
    totalDistanceMeters: 0,
    verifiedRunCount: 0,
    longestStreakDays: 0,
    profileTokenId: null,
  };

  const monthlyStreak = getMonthlyStreakData(runs);
  const thisMonthRuns = monthlyStreak.calendar.filter((d) => d?.hasRun).length;

  // Calculate current streak
  const calculateCurrentStreak = (): number => {
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
      const hasRun = verifiedRuns.some(
        (run) =>
          new Date(run.startTime).toISOString().split("T")[0] === dateStr,
      );
      if (hasRun) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const currentStreak = calculateCurrentStreak();

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFaucet = async () => {
    if (!walletAddress) return;
    try {
      setFaucetLoading(true);
      const result = await requestFaucet(walletAddress);
      if (result.success) {
        const amount =
          result.amount ||
          (result.amountWei ? `${Number(result.amountWei) / 1e18}` : "0.0005");
        toastSuccess(`Faucet sent! ${amount} ETH`);
      } else {
        toastError(`Faucet error: ${result.error}`);
      }
    } catch (err) {
      toastError(
        "Faucet request failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setFaucetLoading(false);
    }
  };

  const handleMintProfile = async () => {
    if (!walletAddress || !activeWallet) return;
    try {
      setMintLoading(true);

      // Switch wallet to Arbitrum Sepolia before sending transaction
      await activeWallet.switchChain(arbitrumSepolia.id);

      // Get Privy wallet provider and create viem wallet client
      const provider = await activeWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: arbitrumSepolia,
        transport: custom(provider),
        account: walletAddress as Address,
      });

      // Call register() directly on-chain (no params, msg.sender = user)
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.profileNFT as Address,
        abi: ProfileNFTABI,
        functionName: "register",
        args: [],
      });

      toastSuccess("Profile registered successfully!");

      // Refresh profile after a short delay for indexing
      setTimeout(async () => {
        try {
          const updatedProfile = await getProfile(walletAddress);
          setUser(updatedProfile);
        } catch {
          // Profile may not be indexed yet
        }
      }, 3000);
    } catch (err) {
      toastError(
        "Mint failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setMintLoading(false);
    }
  };

  const hasProfile = !!user?.profileTokenId;

  if (loading) {
    return (
      <div className="page-enter flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-text-tertiary">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Onboarding: wallet not ready or no profile NFT
  if (!hasProfile) {
    return (
      <div className="page-enter">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-blue-400" />
          <div className="relative px-5 pt-14 pb-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center mb-4 ring-4 ring-white/20 shadow-lg">
                <User size={36} className="text-primary" />
              </div>
              <p className="text-xl font-bold text-white">Welcome to Runera</p>
              <p className="text-sm text-white/70 mt-1">
                Set up your profile to start running
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 -mt-4 space-y-3">
          {/* Step 1: Wallet */}
          <Card variant="white">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                  walletAddress
                    ? "bg-success/10 text-success"
                    : "bg-primary/10 text-primary animate-pulse",
                )}
              >
                {walletAddress ? <Check size={16} /> : "1"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  Create Wallet
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {walletAddress
                    ? `Wallet ready: ${truncateAddress(walletAddress)}`
                    : "Creating your wallet... please wait"}
                </p>
              </div>
              {walletAddress && (
                <button
                  onClick={copyAddress}
                  className="text-xs text-primary font-medium mt-0.5"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </Card>

          {/* Step 2: Faucet */}
          <Card variant="white">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                  !walletAddress
                    ? "bg-surface-tertiary text-text-tertiary"
                    : "bg-info/10 text-info",
                )}
              >
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  Get Testnet ETH
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Get free testnet tokens to create your profile
                </p>
                {walletAddress && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2.5"
                    onClick={handleFaucet}
                    disabled={faucetLoading || !walletAddress}
                    icon={
                      faucetLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Droplets size={14} />
                      )
                    }
                  >
                    {faucetLoading ? "Requesting..." : "Request Faucet"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Step 3: Mint Profile */}
          <Card variant="white">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                  !walletReady
                    ? "bg-surface-tertiary text-text-tertiary"
                    : "bg-primary/10 text-primary",
                )}
              >
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  Create Your Profile
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Your runner identity to record runs and join events
                </p>
                {walletReady && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-2.5"
                    onClick={handleMintProfile}
                    disabled={mintLoading}
                    icon={
                      mintLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Shield size={14} />
                      )
                    }
                  >
                    {mintLoading ? "Creating..." : "Create Profile"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Info box */}
          <div className="bg-primary-50/60 rounded-2xl p-4 mt-2">
            <p className="text-xs text-primary font-medium mb-1">
              Why do I need a profile?
            </p>
            <p className="text-xs text-text-tertiary leading-relaxed">
              Your profile is your runner identity. It tracks your running
              stats, XP, and tier securely. Without it, you cannot record runs,
              join events, or buy cosmetics.
            </p>
          </div>
        </div>

        {/* Logout */}
        <div className="px-5 mt-8 pb-8">
          <Button
            variant="ghost"
            size="md"
            className="w-full text-error/70"
            icon={<LogOut size={15} />}
            onClick={logout}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Profile Header — enhanced with gradient */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-blue-400" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

        <div className="relative px-5 pt-12 pb-14">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center mb-3 ring-4 ring-white/20 shadow-lg">
              <User size={40} className="text-primary" />
            </div>
            <TierBadge
              tier={(displayUser.tier || 1) as TierLevel}
              className="mb-2"
            />
            <p className="text-xl font-bold text-white">
              Level {displayUser.level}
            </p>

            <button
              onClick={copyAddress}
              className="flex items-center gap-1.5 mt-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30"
            >
              <span className="text-xs text-white font-mono font-medium">
                {walletAddress ? truncateAddress(walletAddress) : "---"}
              </span>
              {copied ? (
                <Check size={12} className="text-white" />
              ) : (
                <Copy size={12} className="text-white/80" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* XP Bar — floating below banner */}
      <div className="px-5 -mt-10 relative z-10">
        <div className="bg-white border border-border-light/50 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-tertiary font-medium">
              XP Progress
            </span>
            <span className="text-xs text-text-tertiary">
              {displayUser.exp % XP_PER_LEVEL}/{XP_PER_LEVEL}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-primary-50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${displayUser.exp % XP_PER_LEVEL}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            Next:{" "}
            {
              TIER_NAMES[
                Math.min(
                  ((displayUser.tier as number) || 1) + 1,
                  5,
                ) as TierLevel
              ]
            }
          </p>
        </div>
      </div>

      {/* Quick Actions — soft cards */}
      <div className="px-5 mt-5 flex gap-2.5">
        <Card
          hoverable
          className="flex-1 text-center py-3.5"
          onClick={handleFaucet}
        >
          {faucetLoading ? (
            <Loader2
              size={17}
              className="text-info/70 mx-auto mb-1.5 animate-spin"
            />
          ) : (
            <Droplets size={17} className="text-info/70 mx-auto mb-1.5" />
          )}
          <p className="text-xs font-medium text-text-secondary">Faucet</p>
        </Card>
        <a href="/record" className="flex-1">
          <Card hoverable className="text-center py-3.5">
            <Footprints size={17} className="text-primary/60 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-text-secondary">Record</p>
          </Card>
        </a>
        <Card hoverable className="flex-1 text-center py-3.5">
          <Settings
            size={17}
            className="text-text-tertiary/70 mx-auto mb-1.5"
          />
          <p className="text-xs font-medium text-text-secondary">Settings</p>
        </Card>
      </div>

      {/* Tab Navigation — iOS segmented control */}
      <div className="mt-5 flex gap-1 bg-surface-tertiary rounded-xl p-1 mx-5">
        {(["stats", "feed", "achievements", "equipped"] as ProfileTab[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                activeTab === tab
                  ? "bg-surface text-text-primary shadow-card"
                  : "text-text-tertiary",
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ),
        )}
      </div>

      {/* Tab Content */}
      <div className="px-5 mt-4 pb-6">
        {activeTab === "stats" && (
          <div className="space-y-3">
            {/* Streak Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="!bg-gradient-to-br from-orange-500/10 to-orange-600/5 !border-orange-500/20">
                <div className="flex flex-col items-center text-center py-2">
                  <Flame size={24} className="text-orange-500 mb-2" />
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    {currentStreak}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">
                    Current Streak
                  </p>
                </div>
              </Card>

              <Card className="!bg-gradient-to-br from-blue-500/10 to-blue-600/5 !border-blue-500/20">
                <div className="flex flex-col items-center text-center py-2">
                  <Target size={24} className="text-blue-500 mb-2" />
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                    {thisMonthRuns}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">
                    Runs This Month
                  </p>
                </div>
              </Card>
            </div>

            {/* Monthly Streak Calendar */}
            <Card className="!bg-gradient-to-br from-primary/5 to-primary-light/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <p className="text-sm font-semibold text-text-primary">
                    {monthlyStreak.monthName} {monthlyStreak.year}
                  </p>
                </div>
                <Badge variant="blue" className="text-[10px] px-2 py-0.5">
                  {thisMonthRuns} runs
                </Badge>
              </div>

              {/* Weekday labels */}
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

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {monthlyStreak.calendar.map((day, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium transition-all",
                      !day && "invisible",
                      day?.hasRun &&
                        "bg-gradient-to-br from-primary to-blue-500 text-white shadow-sm scale-105",
                      day?.isToday &&
                        !day?.hasRun &&
                        "bg-surface-tertiary ring-2 ring-primary text-text-primary",
                      day &&
                        !day.hasRun &&
                        !day.isToday &&
                        day.isPast &&
                        "bg-surface-tertiary text-text-tertiary/40",
                      day &&
                        !day.isPast &&
                        "bg-surface-tertiary/40 text-text-tertiary/30",
                    )}
                  >
                    {day?.hasRun ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      day?.day
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
                  <span className="text-[10px] text-text-tertiary">
                    Rest Day
                  </span>
                </div>
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="space-y-2.5 mt-4">
              {[
                {
                  icon: <Footprints size={18} className="text-blue-500" />,
                  label: "Total Distance",
                  value: formatDistance(displayUser.totalDistanceMeters),
                  gradient: "from-blue-500/10 to-blue-600/5",
                  border: "border-blue-500/20",
                },
                {
                  icon: <Trophy size={18} className="text-green-500" />,
                  label: "Verified Runs",
                  value: String(displayUser.verifiedRunCount),
                  gradient: "from-green-500/10 to-green-600/5",
                  border: "border-green-500/20",
                },
                {
                  icon: <Flame size={18} className="text-orange-500" />,
                  label: "Longest Streak",
                  value: `${displayUser.longestStreakDays} days`,
                  gradient: "from-orange-500/10 to-orange-600/5",
                  border: "border-orange-500/20",
                },
                {
                  icon: <Zap size={18} className="text-yellow-500" />,
                  label: "Total XP",
                  value: `${displayUser.exp} XP`,
                  gradient: "from-yellow-500/10 to-yellow-600/5",
                  border: "border-yellow-500/20",
                },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className={cn(
                    "flex items-center gap-3 !bg-gradient-to-br",
                    stat.gradient,
                    `!${stat.border}`,
                  )}
                >
                  <div className="w-11 h-11 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
                    {stat.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-text-tertiary">{stat.label}</p>
                    <p className="text-base font-bold text-text-primary">
                      {stat.value}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "feed" && (
          <div className="space-y-4">
            {MOCK_ACTIVITY_FEED.map((activity) => (
              <div
                key={activity.id}
                className="rounded-2xl bg-surface border border-border-light/70 shadow-card overflow-hidden"
              >
                {/* Header: avatar + name + time + location */}
                <div className="px-4 pt-3.5 pb-2 flex items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      activity.user.avatarColor,
                    )}
                  >
                    {activity.user.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {activity.user.name}
                    </p>
                    <p className="text-[11px] text-text-tertiary">
                      {timeAgo(activity.timestamp)}
                      {activity.location && ` · ${activity.location}`}
                    </p>
                  </div>
                </div>

                {/* Map placeholder */}
                <div className="mx-4 h-32 rounded-xl bg-gradient-to-br from-primary/5 to-blue-500/10 flex items-center justify-center">
                  <MapPin size={24} className="text-primary/30" />
                </div>

                {/* Stats row */}
                <div className="px-4 py-3 flex items-center divide-x divide-border-light/50">
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-text-primary">
                      {formatDistance(activity.distanceMeters)}
                    </p>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                      Distance
                    </p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-text-primary">
                      {formatDuration(activity.durationSeconds)}
                    </p>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                      Duration
                    </p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-text-primary">
                      {formatPace(activity.avgPaceSeconds)}
                    </p>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                      Pace
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "achievements" && (
          <EmptyState
            icon={<Award size={36} />}
            title="No achievements yet"
            description="Complete events to earn achievement NFTs"
          />
        )}

        {activeTab === "equipped" && (
          <EmptyState
            icon={<Package size={36} />}
            title="Nothing equipped"
            description="Visit the market to get cosmetic items"
          />
        )}
      </div>

      {/* Logout — subtle */}
      <div className="px-5 pb-8">
        <Button
          variant="ghost"
          size="md"
          className="w-full text-error/70"
          icon={<LogOut size={15} />}
          onClick={logout}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
