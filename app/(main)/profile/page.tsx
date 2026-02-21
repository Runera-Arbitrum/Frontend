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
import { truncateAddress, formatDistance } from "@/lib/utils";
import { TIER_NAMES, type TierLevel } from "@/lib/types";
import { XP_PER_LEVEL } from "@/lib/constants";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { TierBadge } from "@/components/ui/Badge";
import AchievementBadge from "@/components/ui/AchievementBadge";
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
  BarChart3,
} from "lucide-react";
import {
  getUserAchievements,
  getAchievement,
  type AchievementData,
} from "@/lib/contracts/achievements";
import type { Hex } from "viem";

type ProfileTab = "stats" | "achievements" | "equipped";

interface AchievementWithEvent extends AchievementData {
  eventIdHex: Hex;
}

export default function ProfilePage() {
  const { walletAddress, activeWallet, walletReady, logout } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("stats");
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [achievements, setAchievements] = useState<AchievementWithEvent[]>([]);
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
          console.error("Failed to fetch achievements:", scErr);
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  const displayUser = user || {
    exp: 0,
    level: 1,
    tier: 1 as TierLevel,
    totalDistanceMeters: 0,
    verifiedRunCount: 0,
    longestStreakDays: 0,
    profileTokenId: null,
  };

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

    const isSameDay = (d1: Date, d2: Date) => {
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    };

    for (let i = 0; i <= 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      const hasRun = verifiedRuns.some((run) =>
        isSameDay(new Date(run.startTime), checkDate),
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

      await activeWallet.switchChain(arbitrumSepolia.id);

      const provider = await activeWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: arbitrumSepolia,
        transport: custom(provider),
        account: walletAddress as Address,
      });

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.profileNFT as Address,
        abi: ProfileNFTABI,
        functionName: "register",
        args: [],
      });

      toastSuccess("Profile registered successfully!");

      setTimeout(async () => {
        try {
          const updatedProfile = await getProfile(walletAddress);
          setUser(updatedProfile);
        } catch {}
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

  const hasProfile = user != null;

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

  if (!hasProfile) {
    return (
      <div className="page-enter min-h-screen bg-gradient-to-b from-primary-50/30 to-surface">
        <div className="relative overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-blue-400" />
          <div className="relative px-5 pt-12 pb-20">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center mb-4 ring-4 ring-white/20 shadow-lg">
                <User size={36} className="text-primary" />
              </div>
              <p className="text-xl font-bold text-white">Welcome to Runera</p>
              <p className="text-sm text-white/80 mt-1.5">
                Set up your profile to start running
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 space-y-3">
          <Card variant="white" className="shadow-lg">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-all duration-300",
                  walletAddress
                    ? "bg-gradient-to-br from-success to-green-600 text-white shadow-gentle"
                    : "bg-gradient-to-br from-primary/20 to-primary-light/10 text-primary ring-2 ring-primary/30 animate-pulse",
                )}
              >
                {walletAddress ? <Check size={20} strokeWidth={3} /> : "1"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Create Wallet
                </p>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  {walletAddress
                    ? "Wallet created successfully"
                    : "Creating your wallet... please wait"}
                </p>
                {walletAddress && (
                  <div className="mt-2 flex items-center gap-2 bg-surface-tertiary/60 rounded-lg px-3 py-2">
                    <code className="text-xs font-mono text-text-secondary flex-1 truncate">
                      {truncateAddress(walletAddress)}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="text-xs text-primary font-semibold cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check size={12} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card variant="white" className="shadow-lg">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-all duration-300",
                  !walletAddress
                    ? "bg-surface-tertiary text-text-tertiary"
                    : "bg-gradient-to-br from-info/20 to-blue-500/10 text-info ring-2 ring-info/30",
                )}
              >
                2
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Get Testnet ETH
                </p>
                <p className="text-xs text-text-tertiary leading-relaxed mb-3">
                  Get free testnet tokens to create your profile
                </p>
                {walletAddress && (
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full rounded-xl shadow-sm"
                    onClick={handleFaucet}
                    disabled={faucetLoading || !walletAddress}
                    icon={
                      faucetLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Droplets size={16} />
                      )
                    }
                  >
                    {faucetLoading ? "Requesting..." : "Request Faucet"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card variant="white" className="shadow-lg">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-all duration-300",
                  !walletReady
                    ? "bg-surface-tertiary text-text-tertiary"
                    : "bg-gradient-to-br from-primary/20 to-primary-light/10 text-primary ring-2 ring-primary/30",
                )}
              >
                3
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Create Your Profile
                </p>
                <p className="text-xs text-text-tertiary leading-relaxed mb-3">
                  Your runner identity to record runs and join events
                </p>
                {walletReady && (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full rounded-xl shadow-gentle"
                    onClick={handleMintProfile}
                    disabled={mintLoading}
                    icon={
                      mintLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Shield size={16} />
                      )
                    }
                  >
                    {mintLoading ? "Creating..." : "Create Profile"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-4 border border-primary/10 shadow-sm mt-1">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-primary font-semibold mb-1.5">
                  Why do I need a profile?
                </p>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  Your profile is your runner identity. It tracks your running
                  stats, XP, and tier securely. Without it, you cannot record runs,
                  join events, or buy cosmetics.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-8">
          <Button
            variant="ghost"
            size="md"
            className="w-full text-error/70 rounded-xl"
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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-blue-400" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

        <div className="absolute top-0 inset-x-0 z-20 px-5 ios-header-safe flex items-center justify-end">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white ios-press">
            <Settings size={20} />
          </button>
        </div>

        <div className="relative px-5 pt-16 pb-14">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center mb-3 ring-4 ring-white/20 shadow-lg">
              <User size={40} className="text-primary" />
            </div>
            <TierBadge tier={displayUser.tier as TierLevel} className="mb-2" />
            <p className="text-xl font-bold text-white">
              Level {displayUser.level}
            </p>

            <button
              onClick={copyAddress}
              className="flex items-center gap-1.5 mt-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 ios-press"
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
              style={{ width: `${((displayUser.exp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            Next tier:{" "}
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

      <div className="px-5 mt-5 pb-3">
        <div className="bg-surface-tertiary/80 rounded-xl p-1 flex gap-1">
          {[
            { id: "stats", label: "Stats", icon: <BarChart3 size={14} /> },
            { id: "achievements", label: "Badges", icon: <Award size={14} /> },
            { id: "equipped", label: "Gear", icon: <Package size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ios-press flex items-center justify-center gap-1.5",
                activeTab === tab.id
                  ? "bg-surface text-text-primary shadow-card"
                  : "text-text-tertiary",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 pb-6">
        {activeTab === "stats" && (
          <div className="space-y-3">
            <Card className="!bg-gradient-to-br from-primary/10 to-blue-500/5 !border-primary/20">
              <div className="flex flex-col items-center text-center py-2">
                <Flame size={24} className="text-primary mb-2" />
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  {currentStreak}
                </p>
                <p className="text-[11px] text-text-tertiary mt-1">
                  Current Streak
                </p>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                {
                  icon: <Footprints size={18} className="text-primary" />,
                  label: "Total Distance",
                  value: formatDistance(displayUser.totalDistanceMeters),
                  gradient: "from-primary/10 to-primary-light/5",
                  border: "border-primary/20",
                },
                {
                  icon: <Trophy size={18} className="text-primary" />,
                  label: "Verified Runs",
                  value: String(displayUser.verifiedRunCount),
                  gradient: "from-primary/8 to-blue-500/5",
                  border: "border-primary/15",
                },
                {
                  icon: <Flame size={18} className="text-primary" />,
                  label: "Longest Streak",
                  value: `${displayUser.longestStreakDays} days`,
                  gradient: "from-primary-100/30 to-primary-50/10",
                  border: "border-primary/15",
                },
                {
                  icon: <Zap size={18} className="text-primary" />,
                  label: "Total XP",
                  value: `${displayUser.exp} XP`,
                  gradient: "from-primary-50/50 to-surface",
                  border: "border-primary/20",
                },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className={cn(
                    "flex flex-col items-center justify-center text-center py-4 gap-2 !bg-gradient-to-br ios-press",
                    stat.gradient,
                    `!${stat.border}`,
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shadow-sm">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-base font-bold text-text-primary leading-tight">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wide mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <>
            {achievements.length === 0 ? (
              <EmptyState
                icon={<Award size={36} />}
                title="No achievements yet"
                description="Complete events to earn achievement NFTs"
              />
            ) : (
              <div className="space-y-3">
                {achievements.map((ach, idx) => (
                  <AchievementBadge
                    key={ach.eventIdHex}
                    tier={ach.tier}
                    unlockedAt={ach.unlockedAt}
                    eventIdHex={ach.eventIdHex}
                    variant="full"
                    animationDelay={idx * 80}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "equipped" && (
          <EmptyState
            icon={<Package size={36} />}
            title="Nothing equipped"
            description="Visit the market to get cosmetic items"
          />
        )}
      </div>

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
