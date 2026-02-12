'use client';

import { useState } from 'react';
import { MOCK_EVENTS } from '@/lib/mock-data';
import { formatDistance, formatDate, cn } from '@/lib/utils';
import { TIER_NAMES, type RunEvent } from '@/lib/types';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { TierBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Calendar, Clock, Target, Award, ChevronRight, Trophy } from 'lucide-react';

type FilterTab = 'all' | 'joined' | 'upcoming';

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedEvent, setSelectedEvent] = useState<RunEvent | null>(null);

  const events = MOCK_EVENTS;

  const filtered = events.filter((e) => {
    if (activeTab === 'joined') return e.participationStatus === 'JOINED';
    if (activeTab === 'upcoming') return new Date(e.startTime) > new Date();
    return true;
  });

  return (
    <div className="page-enter">
      <Header title="Events" subtitle="Join challenges & earn rewards" />

      {/* Filter Tabs */}
      <div className="px-4 pt-3 pb-2 flex gap-2">
        {(['all', 'joined', 'upcoming'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeTab === tab
                ? 'bg-primary text-text-inverse'
                : 'bg-surface-tertiary text-text-secondary',
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Event List */}
      <div className="px-4 space-y-3 mt-1 pb-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar size={40} />}
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

      {/* Event Detail Modal */}
      <Modal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.name}
      >
        {selectedEvent && <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </Modal>
    </div>
  );
}

function EventCard({ event, onPress }: { event: RunEvent; onPress: () => void }) {
  const isActive = event.active && new Date(event.endTime) > new Date();
  const isJoined = event.participationStatus === 'JOINED';

  return (
    <Card hoverable onClick={onPress}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-text-primary">{event.name}</h3>
            {isJoined && <Badge variant="blue">Joined</Badge>}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Target size={12} /> {formatDistance(event.targetDistanceMeters)}
            </span>
            <span className="flex items-center gap-1">
              <Award size={12} /> +{event.expReward} XP
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-text-tertiary mt-1 shrink-0" />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
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

function EventDetail({ event, onClose }: { event: RunEvent; onClose: () => void }) {
  const isJoined = event.participationStatus === 'JOINED';
  const isEligible = event.isEligible;

  const handleJoin = () => {
    // TODO: Call joinEvent() API
    alert('Event joined! (mock)');
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DetailStat icon={<Target size={16} />} label="Target" value={formatDistance(event.targetDistanceMeters)} />
        <DetailStat icon={<Award size={16} />} label="Reward" value={`${event.expReward} XP`} />
        <DetailStat icon={<Clock size={16} />} label="Starts" value={formatDate(event.startTime)} />
        <DetailStat icon={<Calendar size={16} />} label="Ends" value={formatDate(event.endTime)} />
      </div>

      <div className="bg-surface-tertiary rounded-xl p-3">
        <p className="text-xs font-medium text-text-secondary mb-2">Requirements</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Min Tier:</span>
          <TierBadge tier={event.minTier} />
        </div>
        {event.minTotalDistanceMeters > 0 && (
          <p className="text-xs text-text-secondary mt-1">
            Min Distance: {formatDistance(event.minTotalDistanceMeters)}
          </p>
        )}
      </div>

      {isJoined ? (
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <Trophy size={24} className="text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-primary">You&apos;re in!</p>
          <p className="text-xs text-text-secondary mt-1">Keep running to complete this challenge</p>
        </div>
      ) : (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleJoin}
          disabled={!isEligible}
        >
          {isEligible ? 'Join Event' : `Requires ${TIER_NAMES[event.minTier]} Tier`}
        </Button>
      )}
    </div>
  );
}

function DetailStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface-tertiary rounded-xl p-3 flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-[10px] text-text-tertiary">{label}</p>
        <p className="text-sm font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}
