'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatDistance, formatDuration, formatPace } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { Play, Square, MapPin, Clock, Zap } from 'lucide-react';

const RunMap = dynamic(() => import('@/components/record/RunMap'), { ssr: false });

type RecordState = 'idle' | 'tracking' | 'completed';

export default function RecordPage() {
  const [state, setState] = useState<RecordState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const geo = useGeolocation();

  // Timer
  useEffect(() => {
    if (state !== 'tracking') return;
    const interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const handleStart = useCallback(() => {
    setState('tracking');
    setElapsed(0);
    geo.resetPath();
    geo.startTracking();
  }, [geo]);

  const handleStop = useCallback(() => {
    setState('completed');
    geo.stopTracking();
    setShowSummary(true);
  }, [geo]);

  const handleDiscard = useCallback(() => {
    setState('idle');
    setElapsed(0);
    geo.resetPath();
    setShowSummary(false);
  }, [geo]);

  const handleSubmit = useCallback(() => {
    // TODO: Call submitRun() API with run data
    alert('Run submitted! (mock)');
    setState('idle');
    setElapsed(0);
    geo.resetPath();
    setShowSummary(false);
  }, [geo]);

  const pace = elapsed > 0 && geo.totalDistanceMeters > 0
    ? (elapsed / (geo.totalDistanceMeters / 1000))
    : 0;

  return (
    <div className="page-enter flex flex-col h-[calc(100dvh-5rem)]">
      {state === 'idle' && (
        <Header title="Record Run" subtitle="Track your activity" />
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <RunMap
          position={geo.position}
          path={geo.path}
          isTracking={state === 'tracking'}
        />

        {/* Live Stats Overlay */}
        {state === 'tracking' && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <Card className="bg-surface/95 backdrop-blur">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-text-tertiary">Distance</p>
                  <p className="text-lg font-bold text-text-primary">
                    {formatDistance(geo.totalDistanceMeters)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Time</p>
                  <p className="text-lg font-bold text-text-primary">
                    {formatDuration(elapsed)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Pace</p>
                  <p className="text-lg font-bold text-text-primary">
                    {pace > 0 ? formatPace(pace) : '--:--'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* GPS indicator */}
        {geo.position && state === 'tracking' && (
          <div className="absolute top-20 right-4 z-10">
            <div className="flex items-center gap-1.5 bg-success/90 text-white px-2.5 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              GPS Active
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Panel */}
      <div className="bg-surface border-t border-border-light px-4 py-4">
        {state === 'idle' && (
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-4">
              Press start to begin tracking your run
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full h-14 text-lg rounded-2xl"
              icon={<Play size={22} />}
              onClick={handleStart}
            >
              Start Run
            </Button>
          </div>
        )}

        {state === 'tracking' && (
          <div className="flex items-center justify-center">
            <Button
              variant="danger"
              size="lg"
              className="w-16 h-16 rounded-full !p-0"
              onClick={handleStop}
            >
              <Square size={24} fill="white" />
            </Button>
          </div>
        )}
      </div>

      {/* Run Summary Modal */}
      <Modal open={showSummary} onClose={() => setShowSummary(false)} title="Run Complete!">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <SummaryStat icon={<MapPin size={18} />} label="Distance" value={formatDistance(geo.totalDistanceMeters)} />
            <SummaryStat icon={<Clock size={18} />} label="Duration" value={formatDuration(elapsed)} />
            <SummaryStat icon={<Zap size={18} />} label="Avg Pace" value={pace > 0 ? formatPace(pace) : '--'} />
          </div>

          <div className="bg-primary-50 rounded-xl p-4 text-center">
            <p className="text-sm text-primary font-semibold">+100 XP</p>
            <p className="text-xs text-text-secondary mt-0.5">Pending verification</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={handleDiscard}>
              Discard
            </Button>
            <Button variant="primary" size="lg" className="flex-1" onClick={handleSubmit}>
              Submit Run
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface-tertiary rounded-xl p-3">
      <div className="text-primary mb-1 flex justify-center">{icon}</div>
      <p className="text-base font-bold text-text-primary">{value}</p>
      <p className="text-[10px] text-text-tertiary">{label}</p>
    </div>
  );
}
