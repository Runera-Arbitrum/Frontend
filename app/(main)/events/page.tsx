"use client";

import { useState, useEffect } from "react";
import { keccak256, toHex } from "viem";
import { useAuth } from "@/hooks/useAuth";
import { getEvents, joinEvent as apiJoinEvent, createEvent, claimAchievement } from "@/lib/api";
import { formatDistance, formatDate, cn } from "@/lib/utils";
import { TIER_NAMES, type RunEvent, type TierLevel } from "@/lib/types";
import { EVENT_MANAGER_ADDRESS } from "@/lib/constants";
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
} from "lucide-react";

type FilterTab = "all" | "joined" | "upcoming";

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
        </div>
      ) : isJoined && isTargetReached && !event.hasClaimed ? (
        <div className="space-y-3">
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <Trophy size={24} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-700">Target Reached</p>
            <p className="text-xs text-text-tertiary mt-1">
              Claim your {event.expReward} XP reward
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
  const { walletAddress } = useAuth();
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
      const result = await createEvent({
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
      });

      if (result.success) {
        toastSuccess("Event created successfully!");
        onClose();
      } else {
        toastError(result.message || "Failed to create event");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.toLowerCase().includes("already exists")) {
        toastError("Event ID already exists. Please use a different Event ID.");
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
