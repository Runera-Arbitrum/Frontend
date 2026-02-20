"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getEvents, joinEvent as apiJoinEvent, createEvent } from "@/lib/api";
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
} from "lucide-react";

type FilterTab = "all" | "joined" | "upcoming";

export default function EventsPage() {
  const { walletAddress } = useAuth();
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
      const mappedEvents: RunEvent[] = (res.events || []).map((e: any) => ({
        eventId: e.eventId,
        name: e.name,
        minTier: e.minTier || 1,
        minTotalDistanceMeters: e.minTotalDistanceMeters || 0,
        targetDistanceMeters: e.targetDistanceMeters,
        expReward: e.expReward,
        startTime: e.startTime,
        endTime: e.endTime,
        active: e.active,
        isEligible: e.userProgress?.isEligible ?? true,
        participationStatus: e.userProgress?.hasJoined ? "JOINED" : null,
      }));
      setEvents(mappedEvents);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [walletAddress]);

  const filtered = events.filter((e) => {
    if (activeTab === "joined") return e.participationStatus === "JOINED";
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
        right={
          isEventManager ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-gentle transition-all duration-200 active:scale-95"
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

      <div className="px-5 pt-3 pb-2 flex gap-2">
        {(["all", "joined", "upcoming"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
              activeTab === tab
                ? "bg-primary/90 text-text-inverse shadow-gentle"
                : "bg-surface-tertiary text-text-tertiary",
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
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
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </Modal>

      <Modal
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Event"
      >
        <CreateEventForm
          onClose={() => {
            setShowCreateForm(false);
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

  return (
    <Card hoverable onClick={onPress}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {event.name}
            </h3>
            {isJoined && <Badge variant="blue">Joined</Badge>}
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
  const isEligible = event.isEligible;
  const [joining, setJoining] = useState(false);

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

      {isJoined ? (
        <div className="bg-primary-50/50 rounded-2xl p-5 text-center">
          <Trophy size={22} className="text-primary/70 mx-auto mb-2" />
          <p className="text-sm font-semibold text-primary">You&apos;re in!</p>
          <p className="text-xs text-text-tertiary mt-1">
            Keep running to complete this challenge
          </p>
        </div>
      ) : (
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
          ) : (
            `Requires ${TIER_NAMES[event.minTier]} Tier`
          )}
        </Button>
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
      const result = await createEvent({
        eventId: formData.eventId,
        name: formData.name,
        minTier: formData.minTier,
        minTotalDistanceMeters: formData.minTotalDistanceMeters,
        targetDistanceMeters: formData.targetDistanceMeters,
        expReward: formData.expReward,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      if (result.success) {
        toastSuccess("Event created successfully!");
        onClose();
      } else {
        toastError(result.message || "Failed to create event");
      }
    } catch (err) {
      console.error("Create event error:", err);
      toastError(
        "Failed to create event: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
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
