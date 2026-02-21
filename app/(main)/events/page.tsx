"use client";

import { useState, useEffect } from "react";
import { keccak256, toHex, createPublicClient, createWalletClient, custom, http, type Address, type Hex } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { useAuth } from "@/hooks/useAuth";
import { getEvents, joinEvent as apiJoinEvent, createEvent, claimAchievement } from "@/lib/api";
import { getEventReward, isEventManagerOnChain } from "@/lib/contracts/events";
import { formatDistance, formatDate, cn } from "@/lib/utils";
import { TIER_NAMES, BADGE_ICONS, type RunEvent, type TierLevel, type BadgeIconName } from "@/lib/types";
import { CONTRACT_ADDRESSES, EVENT_MANAGER_ADDRESS, RPC_URL } from "@/lib/constants";
import EventRegistryABI from "@/lib/contracts/abis/RuneraEventRegistry.json";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { TierBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  Calendar,
  Clock,
  Target,
  Award,
  ChevronRight,
  Trophy,
  Loader2,
  Plus,
  Shield,
  CheckCircle2,
  Gift,
  Zap,
  Palette,
  Medal,
  Flame,
  Mountain,
  Rocket,
  Star,
  Bolt,
  Crown,
  Heart,
  Flag,
  Compass,
  Sunrise,
  type LucideIcon,
} from "lucide-react";

type FilterTab = "all" | "joined" | "upcoming";

const BADGE_ICON_MAP: Record<BadgeIconName, LucideIcon> = {
  trophy: Trophy,
  medal: Medal,
  flame: Flame,
  mountain: Mountain,
  rocket: Rocket,
  star: Star,
  bolt: Bolt,
  shield: Shield,
  crown: Crown,
  heart: Heart,
  target: Target,
  flag: Flag,
  compass: Compass,
  sunrise: Sunrise,
};

function getBadgeIcon(name?: string): LucideIcon {
  if (name && name in BADGE_ICON_MAP) return BADGE_ICON_MAP[name as BadgeIconName];
  return Award;
}

const TIER_BADGE_COLORS: Record<number, { bg: string; border: string; text: string; iconBg: string }> = {
  1: { bg: "from-amber-600/10 to-amber-400/5", border: "border-amber-500/20", text: "text-amber-700", iconBg: "bg-amber-500/15" },
  2: { bg: "from-gray-400/10 to-gray-300/5", border: "border-gray-400/20", text: "text-gray-600", iconBg: "bg-gray-400/15" },
  3: { bg: "from-yellow-500/10 to-yellow-400/5", border: "border-yellow-500/20", text: "text-yellow-700", iconBg: "bg-yellow-500/15" },
  4: { bg: "from-slate-300/10 to-purple-200/5", border: "border-purple-400/20", text: "text-purple-700", iconBg: "bg-purple-400/15" },
  5: { bg: "from-cyan-400/10 to-blue-300/5", border: "border-cyan-400/20", text: "text-cyan-700", iconBg: "bg-cyan-400/15" },
};

function BadgePreview({
  name,
  icon,
  tier,
  xp,
  size = "md",
}: {
  name: string;
  icon?: BadgeIconName;
  tier: number;
  xp: number;
  size?: "sm" | "md";
}) {
  const IconComponent = getBadgeIcon(icon);
  const t = tier >= 1 && tier <= 5 ? tier : 1;
  const colors = TIER_BADGE_COLORS[t];
  const tierName = TIER_NAMES[t as TierLevel] || `Tier ${t}`;
  const isSm = size === "sm";

  return (
    <div className={cn(
      "rounded-2xl border bg-gradient-to-br flex items-center gap-3",
      colors.bg,
      colors.border,
      isSm ? "p-2.5" : "p-3.5",
    )}>
      <div className={cn(
        "rounded-xl flex items-center justify-center shrink-0",
        colors.iconBg,
        isSm ? "w-10 h-10" : "w-12 h-12",
      )}>
        <IconComponent size={isSm ? 18 : 22} className={colors.text} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "font-semibold text-text-primary truncate",
          isSm ? "text-xs" : "text-sm",
        )}>
          {name || "Untitled Badge"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-[10px] font-medium", colors.text)}>
            {tierName}
          </span>
          {xp > 0 && (
            <>
              <span className="text-text-tertiary/40">|</span>
              <span className="text-[10px] text-text-tertiary">+{xp} XP</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { walletAddress } = useAuth();
  const { error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedEvent, setSelectedEvent] = useState<RunEvent | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isEventManager = walletAddress?.toLowerCase() === EVENT_MANAGER_ADDRESS.toLowerCase();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await getEvents(walletAddress || undefined);
      const eventsList = res.events || (res as any).data || [];
      const mappedEvents: RunEvent[] = (Array.isArray(eventsList) ? eventsList : []).map((e: any) => {
        const progress = e.userProgress;
        const directStatus = e.status as string | null;
        let participationStatus: RunEvent["participationStatus"] = null;
        if (progress?.hasClaimed || directStatus === "COMPLETED") participationStatus = "COMPLETED";
        else if (progress?.hasJoined || directStatus === "JOINED") participationStatus = "JOINED";
        return {
          eventId: e.eventId,
          name: e.name,
          minTier: e.minTier || 1,
          minTotalDistanceMeters: e.minTotalDistanceMeters || 0,
          targetDistanceMeters: e.targetDistanceMeters,
          expReward: e.expReward,
          startTime: e.startTime,
          endTime: e.endTime,
          active: e.active,
          isEligible: e.eligible ?? progress?.isEligible ?? true,
          participationStatus,
          distanceCovered: e.distanceCovered ?? progress?.distanceCovered ?? 0,
          hasClaimed: e.hasClaimed ?? progress?.hasClaimed ?? false,
        };
      });
      setEvents(mappedEvents);

      const rewardResults = await Promise.allSettled(
        mappedEvents.map((ev) => getEventReward(ev.eventId as Hex)),
      );
      const withRewards = mappedEvents.map((ev, i) => {
        const result = rewardResults[i];
        if (result.status === "fulfilled" && result.value?.hasReward) {
          return { ...ev, reward: result.value };
        }
        return ev;
      });
      setEvents(withRewards);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toastError("Failed to load events: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [walletAddress]);

  const filtered = events.filter((e) => {
    if (activeTab === "joined") return e.participationStatus === "JOINED" || e.participationStatus === "COMPLETED";
    if (activeTab === "upcoming") return new Date(e.startTime) > new Date();
    return true;
  });

  if (loading) {
    return (
      <div className="page-enter">
        <Header title="Events" subtitle="Join challenges & earn rewards" />
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-text-tertiary">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter pb-6">
      <Header
        title="Events"
        subtitle={isEventManager ? "Event Manager Dashboard" : "Join challenges & earn rewards"}
        largeTitle={!isEventManager}
        right={
          isEventManager ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-gentle transition-all duration-200 ios-press"
            >
              <Plus size={18} className="text-white" />
            </button>
          ) : null
        }
      />

      {isEventManager && (
        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-blue-500/5 border border-primary/20 rounded-2xl px-4 py-3">
            <Shield size={18} className="text-primary" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-primary">Event Manager</p>
              <p className="text-[10px] text-text-tertiary">You can create and manage events</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pt-3 pb-4">
        <div className="bg-surface-tertiary/80 rounded-xl p-1 flex gap-1">
          {(["all", "joined", "upcoming"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ios-press",
                activeTab === tab
                  ? "bg-surface text-text-primary shadow-card"
                  : "text-text-tertiary",
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3 mt-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar size={36} />}
            title="No events found"
            description="Check back later for new challenges"
          />
        ) : (
          filtered.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              onPress={() => setSelectedEvent(event)}
            />
          ))
        )}
      </div>

      <Modal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.name}
      >
        {selectedEvent && (
          <EventDetail
            event={selectedEvent}
            onClose={() => {
              setSelectedEvent(null);
              fetchEvents();
            }}
          />
        )}
      </Modal>

      <Modal
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Event"
      >
        <CreateEventForm
          onClose={async () => {
            setShowCreateForm(false);
            await new Promise((r) => setTimeout(r, 500));
            fetchEvents();
          }}
        />
      </Modal>
    </div>
  );
}

function EventCard({
  event,
  onPress,
}: {
  event: RunEvent;
  onPress: () => void;
}) {
  const isActive = event.active && new Date(event.endTime) > new Date();
  const isJoined = event.participationStatus === "JOINED";
  const isCompleted = event.participationStatus === "COMPLETED";
  const hasProgress = (isJoined || isCompleted) && event.targetDistanceMeters > 0;
  const progressPercent = hasProgress
    ? Math.min(100, Math.round(((event.distanceCovered || 0) / event.targetDistanceMeters) * 100))
    : 0;
  const isTargetReached = progressPercent >= 100;

  return (
    <Card hoverable onClick={onPress}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {event.name}
            </h3>
            {isCompleted && <Badge variant="success">Completed</Badge>}
            {isJoined && !isCompleted && <Badge variant="blue">Joined</Badge>}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-tertiary flex-wrap">
            <span className="flex items-center gap-1">
              <Target size={12} className="text-text-tertiary/70 shrink-0" />
              {formatDistance(event.targetDistanceMeters)}
            </span>
            <span className="flex items-center gap-1">
              <Award size={12} className="text-text-tertiary/70 shrink-0" />
              +{event.expReward} XP
            </span>
            {event.reward?.hasReward && (() => {
              const BadgeIcon = getBadgeIcon(event.reward.badgeIcon);
              return (
                <span className="flex items-center gap-1 text-primary font-medium">
                  <BadgeIcon size={12} className="shrink-0" />
                  {event.reward.badgeName || "Badge"}
                </span>
              );
            })()}
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-text-tertiary/50 mt-1 shrink-0 ml-2"
        />
      </div>

      {hasProgress && (
        <div className="mt-3 pt-3 border-t border-border-light/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-text-secondary">
              {isTargetReached ? "Target reached" : "Progress"}
            </span>
            <span className={cn(
              "text-[11px] font-semibold",
              isTargetReached ? "text-green-600" : "text-primary",
            )}>
              {formatDistance(event.distanceCovered || 0)} / {formatDistance(event.targetDistanceMeters)}
            </span>
          </div>
          <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isTargetReached ? "bg-green-500" : "bg-primary",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {!hasProgress && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light/50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TierBadge tier={event.minTier} />
            {isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="default">Closed</Badge>
            )}
          </div>
          <span className="text-[10px] text-text-tertiary">
            ends {formatDate(event.endTime)}
          </span>
        </div>
      )}
    </Card>
  );
}

function EventDetail({
  event,
  onClose,
}: {
  event: RunEvent;
  onClose: () => void;
}) {
  const { walletAddress } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const isJoined = event.participationStatus === "JOINED";
  const isCompleted = event.participationStatus === "COMPLETED";
  const isParticipating = isJoined || isCompleted;
  const isEligible = event.isEligible;
  const [joining, setJoining] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const progressPercent = isParticipating && event.targetDistanceMeters > 0
    ? Math.min(100, Math.round(((event.distanceCovered || 0) / event.targetDistanceMeters) * 100))
    : 0;
  const isTargetReached = progressPercent >= 100;

  const handleJoin = async () => {
    if (!walletAddress) return;
    try {
      setJoining(true);
      await apiJoinEvent(event.eventId, walletAddress);
      toastSuccess("Successfully joined the event!");
      onClose();
    } catch (err) {
      toastError(
        "Failed to join event: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setJoining(false);
    }
  };

  const handleClaim = async () => {
    if (!walletAddress) return;
    try {
      setClaiming(true);
      await claimAchievement(walletAddress, event.eventId);
      toastSuccess("Achievement claimed! Check your profile for the NFT.");
      onClose();
    } catch (err) {
      toastError(
        "Failed to claim: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <DetailStat
          icon={<Target size={15} />}
          label="Target"
          value={formatDistance(event.targetDistanceMeters)}
        />
        <DetailStat
          icon={<Award size={15} />}
          label="Reward"
          value={`${event.expReward} XP`}
        />
        <DetailStat
          icon={<Clock size={15} />}
          label="Starts"
          value={formatDate(event.startTime)}
        />
        <DetailStat
          icon={<Calendar size={15} />}
          label="Ends"
          value={formatDate(event.endTime)}
        />
      </div>

      <div className="bg-surface-tertiary/60 rounded-2xl p-4">
        <p className="text-xs font-medium text-text-secondary mb-2">
          Requirements
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Min Tier:</span>
          <TierBadge tier={event.minTier} />
        </div>
        {event.minTotalDistanceMeters > 0 && (
          <p className="text-xs text-text-tertiary mt-1.5">
            Min Distance: {formatDistance(event.minTotalDistanceMeters)}
          </p>
        )}
      </div>

      {event.reward?.hasReward && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-text-secondary px-1">Achievement Badge (Soulbound NFT)</p>
          <BadgePreview
            name={event.reward.badgeName || event.name}
            icon={event.reward.badgeIcon}
            tier={event.reward.achievementTier}
            xp={event.reward.xpBonus}
          />
          <div className="flex gap-2 flex-wrap">
            {event.reward.xpBonus > 0 && (
              <div className="flex items-center gap-1.5 bg-surface-tertiary/60 rounded-xl px-3 py-2">
                <Zap size={13} className="text-primary shrink-0" />
                <span className="text-[11px] font-medium text-text-secondary">+{event.reward.xpBonus} XP Bonus</span>
              </div>
            )}
            {event.reward.cosmeticItemIds.length > 0 && (
              <div className="flex items-center gap-1.5 bg-surface-tertiary/60 rounded-xl px-3 py-2">
                <Palette size={13} className="text-primary shrink-0" />
                <span className="text-[11px] font-medium text-text-secondary">
                  {event.reward.cosmeticItemIds.length} Cosmetic{event.reward.cosmeticItemIds.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {isParticipating && (
        <div className="bg-surface-tertiary/40 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-text-secondary">Your Progress</p>
            <span className={cn(
              "text-xs font-semibold",
              isTargetReached ? "text-green-600" : "text-primary",
            )}>
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-surface-tertiary rounded-full overflow-hidden mb-2">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isTargetReached ? "bg-green-500" : "bg-primary",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-tertiary">
              {formatDistance(event.distanceCovered || 0)}
            </span>
            <span className="text-[11px] text-text-tertiary">
              {formatDistance(event.targetDistanceMeters)}
            </span>
          </div>
        </div>
      )}

      {isCompleted ? (
        <div className="bg-green-50 rounded-2xl p-5 text-center">
          <CheckCircle2 size={28} className="text-green-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-green-700">Challenge Completed</p>
          <p className="text-xs text-text-tertiary mt-1">
            You earned {event.expReward} XP from this event
          </p>
          {event.reward?.hasReward && (
            <p className="text-[11px] text-green-600 mt-1.5 font-medium">
              Badge &quot;{event.reward.badgeName || event.name}&quot; claimed
            </p>
          )}
        </div>
      ) : isJoined && isTargetReached && !event.hasClaimed ? (
        <div className="space-y-3">
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <Trophy size={24} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-700">Target Reached</p>
            <p className="text-xs text-text-tertiary mt-1">
              {event.reward?.hasReward
                ? `Claim your badge and ${event.expReward} XP reward`
                : `Claim your ${event.expReward} XP reward`
              }
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full rounded-2xl"
            onClick={handleClaim}
            disabled={claiming}
          >
            {claiming ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Claiming...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Award size={16} /> Claim Reward
              </span>
            )}
          </Button>
        </div>
      ) : isJoined ? (
        <div className="bg-primary-50/50 rounded-2xl p-5 text-center">
          <Trophy size={22} className="text-primary/70 mx-auto mb-2" />
          <p className="text-sm font-semibold text-primary">You&apos;re in!</p>
          <p className="text-xs text-text-tertiary mt-1">
            Run {formatDistance(event.targetDistanceMeters - (event.distanceCovered || 0))} more to complete this challenge
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full rounded-2xl"
            onClick={handleJoin}
            disabled={!isEligible || joining}
          >
            {joining ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Joining...
              </span>
            ) : isEligible ? (
              "Join Event"
            ) : event.minTotalDistanceMeters > 0 ? (
              `Requires ${formatDistance(event.minTotalDistanceMeters)} total distance`
            ) : (
              "Not eligible yet"
            )}
          </Button>
          {!isEligible && (
            <p className="text-[11px] text-text-tertiary text-center">
              Complete more runs to become eligible for this event
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DetailStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface-tertiary/60 rounded-2xl p-3.5 flex items-center gap-3">
      <div className="text-primary/60 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-text-tertiary">{label}</p>
        <p className="text-sm font-semibold text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

function CreateEventForm({ onClose }: { onClose: () => void }) {
  const { walletAddress, activeWallet, walletReady } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    eventId: "",
    name: "",
    minTier: 1,
    minTotalDistanceMeters: 0,
    targetDistanceMeters: 5000,
    expReward: 100,
    startTime: "",
    endTime: "",
    enableReward: false,
    rewardTier: 1,
    rewardXpBonus: 0,
    rewardCosmeticIds: "",
    badgeName: "",
    badgeIcon: "trophy" as BadgeIconName,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      toastError("Wallet not connected");
      return;
    }

    if (!formData.eventId || !formData.name || !formData.startTime || !formData.endTime) {
      toastError("Please fill in all required fields");
      return;
    }

    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);

    if (endDate <= startDate) {
      toastError("End date must be after start date");
      return;
    }

    try {
      setSubmitting(true);
      const eventIdBytes32 = keccak256(toHex(formData.eventId));
      const cosmeticIds = formData.rewardCosmeticIds
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);

      if (!walletReady || !activeWallet || !walletAddress) {
        toastError("Wallet not ready for on-chain transaction");
        return;
      }

      const hasManagerRole = await isEventManagerOnChain(walletAddress as Address);
      if (!hasManagerRole) {
        toastError("Connected wallet is not EVENT_MANAGER on-chain");
        return;
      }

      await activeWallet.switchChain(arbitrumSepolia.id);
      const provider = await activeWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: arbitrumSepolia,
        transport: custom(provider),
        account: walletAddress as Address,
      });

      const reward = {
        achievementTier: formData.enableReward ? formData.rewardTier : 0,
        cosmeticItemIds: formData.enableReward
          ? cosmeticIds.map((id) => BigInt(id))
          : [],
        xpBonus: formData.enableReward ? BigInt(formData.rewardXpBonus) : BigInt(0),
        hasReward: formData.enableReward,
      };

      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.eventRegistry as Address,
        abi: EventRegistryABI,
        functionName: "createEvent",
        args: [
          eventIdBytes32,
          formData.name,
          BigInt(Math.floor(startDate.getTime() / 1000)),
          BigInt(Math.floor(endDate.getTime() / 1000)),
          BigInt(0),
          reward,
        ],
      });

      const publicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(RPC_URL),
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === "reverted") {
        toastError("On-chain transaction reverted. Event not created.");
        return;
      }

      await createEvent({
        eventId: eventIdBytes32,
        name: formData.name,
        minTier: formData.minTier,
        minTotalDistanceMeters: formData.minTotalDistanceMeters,
        targetDistanceMeters: formData.targetDistanceMeters,
        expReward: formData.expReward,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        active: true,
        chainId: 421614,
        ...(formData.enableReward
          ? {
              reward: {
                achievementTier: formData.rewardTier,
                cosmeticItemIds: cosmeticIds,
                xpBonus: formData.rewardXpBonus,
                hasReward: true,
                badgeName: formData.badgeName || formData.name,
                badgeIcon: formData.badgeIcon,
              },
            }
          : {}),
      });

      toastSuccess("Event created successfully!");
      onClose();
    } catch (err: any) {
      const msg = err?.message || err?.shortMessage || "Unknown error";
      if (err?.code === 4001 || msg.includes("User denied") || msg.includes("user rejected")) {
        toastError("Transaction cancelled");
      } else if (msg.toLowerCase().includes("already exists") || msg.includes("EventAlreadyExists")) {
        toastError("Event ID already exists. Please use a different Event ID.");
      } else if (msg.includes("NotEventManager")) {
        toastError("Your wallet does not have the Event Manager role on-chain");
      } else if (msg.includes("InvalidTimeWindow")) {
        toastError("Invalid time window. Check start and end dates.");
      } else {
        toastError("Failed to create event: " + msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Event ID <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={formData.eventId}
          onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
          placeholder="e.g. marathon-2026"
          className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-light text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Event Name <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Spring Marathon Challenge"
          className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-light text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Min Tier
          </label>
          <select
            value={formData.minTier}
            onChange={(e) => setFormData({ ...formData, minTier: Number(e.target.value) as TierLevel })}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-light text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {[1, 2, 3, 4, 5].map((tier) => (
              <option key={tier} value={tier}>
                {TIER_NAMES[tier as TierLevel]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            XP Reward
          </label>
          <input
            type="number"
            value={formData.expReward}
            onChange={(e) => setFormData({ ...formData, expReward: Number(e.target.value) })}
            min="0"
            step="10"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-light text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Target Distance (km)
        </label>
        <input
          type="number"
          value={formData.targetDistanceMeters / 1000}
          onChange={(e) => setFormData({ ...formData, targetDistanceMeters: Number(e.target.value) * 1000 })}
          min="0.1"
          step="0.1"
          className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-light text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Min Total Distance (km)
        </label>
        <input
          type="number"
          value={formData.minTotalDistanceMeters / 1000}
          onChange={(e) => setFormData({ ...formData, minTotalDistanceMeters: Number(e.target.value) * 1000 })}
          min="0"
          step="0.1"
          className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-light text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <p className="text-[10px] text-text-tertiary mt-1">Total distance user must have run before</p>
      </div>

      <div className="border-t border-border-light/50 pt-4 mt-1">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={cn(
              "w-10 h-6 rounded-full transition-colors duration-200 relative cursor-pointer",
              formData.enableReward ? "bg-primary" : "bg-surface-tertiary",
            )}
            onClick={() => setFormData({ ...formData, enableReward: !formData.enableReward })}
          >
            <div
              className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200",
                formData.enableReward ? "translate-x-[18px]" : "translate-x-0.5",
              )}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary">Enable Rewards</p>
            <p className="text-[10px] text-text-tertiary">Configure achievement and cosmetic rewards</p>
          </div>
        </label>
      </div>

      {formData.enableReward && (
        <div className="space-y-4 bg-primary-50/30 rounded-2xl p-4 border border-primary/10">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Achievement Badge (Soulbound NFT)</p>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Badge Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.badgeName}
              onChange={(e) => setFormData({ ...formData, badgeName: e.target.value })}
              placeholder="e.g. Hero Run"
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-light text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Badge Icon
            </label>
            <div className="grid grid-cols-7 gap-2">
              {BADGE_ICONS.map((iconName) => {
                const Icon = BADGE_ICON_MAP[iconName];
                const isSelected = formData.badgeIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormData({ ...formData, badgeIcon: iconName })}
                    className={cn(
                      "w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "bg-primary text-white shadow-md scale-105"
                        : "bg-surface border border-border-light text-text-tertiary hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Achievement Tier
              </label>
              <select
                value={formData.rewardTier}
                onChange={(e) => setFormData({ ...formData, rewardTier: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-light text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {[1, 2, 3, 4, 5].map((tier) => (
                  <option key={tier} value={tier}>
                    {TIER_NAMES[tier as TierLevel]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                XP Bonus
              </label>
              <input
                type="number"
                value={formData.rewardXpBonus}
                onChange={(e) => setFormData({ ...formData, rewardXpBonus: Number(e.target.value) })}
                min="0"
                step="10"
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-light text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Cosmetic Item IDs
            </label>
            <input
              type="text"
              value={formData.rewardCosmeticIds}
              onChange={(e) => setFormData({ ...formData, rewardCosmeticIds: e.target.value })}
              placeholder="e.g. 1, 2, 3"
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-light text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-[10px] text-text-tertiary mt-1">Comma-separated cosmetic NFT item IDs</p>
          </div>

          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Preview</p>
            <BadgePreview
              name={formData.badgeName || formData.name || "Badge Name"}
              icon={formData.badgeIcon}
              tier={formData.rewardTier}
              xp={formData.rewardXpBonus}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Start Date <span className="text-error">*</span>
        </label>
        <input
          type="datetime-local"
          value={formData.startTime}
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-light text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          End Date <span className="text-error">*</span>
        </label>
        <input
          type="datetime-local"
          value={formData.endTime}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl bg-surface-tertiary border border-border-light text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 rounded-xl"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="flex-1 rounded-xl"
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Creating...
            </span>
          ) : (
            "Create Event"
          )}
        </Button>
      </div>
    </form>
  );
}
