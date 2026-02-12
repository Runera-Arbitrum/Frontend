'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatDistance, formatDuration, formatPace } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  Play, Square, Pause, ChevronDown, MapPin, Clock,
  Zap, Mountain, Flame, Check, Loader2, ArrowLeft,
  Map, BarChart3, Footprints,
} from 'lucide-react';

const RunMap = dynamic(() => import('@/components/record/RunMap'), { ssr: false });

type RecordState = 'idle' | 'running' | 'paused' | 'validating' | 'summary';
type RunView = 'stats' | 'map';

interface ValidateStep {
  label: string;
  status: 'pending' | 'loading' | 'done';
}

export default function RecordPage() {
  const [state, setState] = useState<RecordState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [runView, setRunView] = useState<RunView>('map');
  const geo = useGeolocation();

  // Validation steps
  const [validateSteps, setValidateSteps] = useState<ValidateStep[]>([
    { label: 'Upload data packet', status: 'pending' },
    { label: 'Verify GPS path', status: 'pending' },
    { label: 'Approve score', status: 'pending' },
  ]);

  // Timer
  useEffect(() => {
    if (state !== 'running') return;
    const interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const pace = elapsed > 0 && geo.totalDistanceMeters > 0
    ? (elapsed / (geo.totalDistanceMeters / 1000))
    : 0;

  const distanceKm = (geo.totalDistanceMeters / 1000).toFixed(2);
  const speedKmh = elapsed > 0 && geo.totalDistanceMeters > 0
    ? ((geo.totalDistanceMeters / 1000) / (elapsed / 3600)).toFixed(1)
    : '0.0';

  // --- Handlers ---
  const handleStart = useCallback(() => {
    setState('running');
    setRunView('map');
    setElapsed(0);
    geo.resetPath();
    geo.startTracking();
  }, [geo]);

  const handlePause = useCallback(() => {
    setState('paused');
    geo.stopTracking();
  }, [geo]);

  const handleResume = useCallback(() => {
    setState('running');
    geo.startTracking();
  }, [geo]);

  const handleStop = useCallback(() => {
    geo.stopTracking();
    setState('validating');

    setValidateSteps([
      { label: 'Upload data packet', status: 'loading' },
      { label: 'Verify GPS path', status: 'pending' },
      { label: 'Approve score', status: 'pending' },
    ]);

    setTimeout(() => {
      setValidateSteps([
        { label: 'Upload data packet', status: 'done' },
        { label: 'Verify GPS path', status: 'loading' },
        { label: 'Approve score', status: 'pending' },
      ]);
    }, 1500);

    setTimeout(() => {
      setValidateSteps([
        { label: 'Upload data packet', status: 'done' },
        { label: 'Verify GPS path', status: 'done' },
        { label: 'Uploading data', status: 'loading' },
      ]);
    }, 3000);

    setTimeout(() => {
      setValidateSteps([
        { label: 'Upload data packet', status: 'done' },
        { label: 'GPS path verified', status: 'done' },
        { label: 'Data updated', status: 'done' },
      ]);
      setState('summary');
    }, 4500);
  }, [geo]);

  const handleReset = useCallback(() => {
    setState('idle');
    setRunView('map');
    setElapsed(0);
    geo.resetPath();
  }, [geo]);

  const handleSubmit = useCallback(() => {
    alert('Run submitted! (mock)');
    handleReset();
  }, [handleReset]);

  // --- IDLE ---
  if (state === 'idle') {
    return (
      <div className="page-enter flex flex-col h-[calc(100dvh-6rem)]">
        {/* Top bar */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="w-8" />
          <button className="flex items-center gap-1.5 bg-surface-tertiary px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-text-secondary">READY</span>
            <ChevronDown size={14} className="text-text-tertiary" />
          </button>
          <div className="w-8" />
        </div>

        {/* Big timer & distance */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <p className="text-[11px] text-primary font-medium uppercase tracking-wider mb-1">Time Elapsed</p>
          <p className="text-5xl font-light text-text-primary tracking-tight">00:00</p>

          <div className="mt-8">
            <p className="text-4xl font-light text-text-primary tracking-tight text-center">0.00</p>
            <p className="text-[11px] text-primary font-medium uppercase tracking-wider text-center mt-1">Kilometers</p>
          </div>
        </div>

        {/* Start button — shoe icon */}
        <div className="flex justify-center pb-8">
          <button
            onClick={handleStart}
            className="w-[72px] h-[72px] rounded-full bg-primary flex items-center justify-center shadow-gentle transition-all duration-200 active:scale-95"
          >
            <Footprints size={28} className="text-white" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  // --- RUNNING ---
  if (state === 'running') {
    return (
      <div className="page-enter flex flex-col h-[calc(100dvh-6rem)]">
        {/* Top bar with view toggle */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          {/* View toggle */}
          <div className="flex items-center bg-surface-tertiary rounded-full p-0.5">
            <button
              onClick={() => setRunView('stats')}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                runView === 'stats' ? 'bg-primary text-white' : 'text-text-tertiary',
              )}
            >
              <BarChart3 size={15} />
            </button>
            <button
              onClick={() => setRunView('map')}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                runView === 'map' ? 'bg-primary text-white' : 'text-text-tertiary',
              )}
            >
              <Map size={15} />
            </button>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">RUNNING</span>
          </div>

          <div className="w-[72px]" />
        </div>

        {/* Map view */}
        {runView === 'map' ? (
          <>
            <div className="flex-1 relative">
              <RunMap
                position={geo.position}
                path={geo.path}
                isTracking={true}
              />
              {/* GPS indicator */}
              {geo.position && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center gap-1.5 bg-success text-white px-2.5 py-1 rounded-full text-[11px] font-medium shadow-soft">
                    <MapPin size={10} />
                    GPS
                  </div>
                </div>
              )}
            </div>

            {/* Bottom stats overlay */}
            <div className="bg-surface border-t border-border-light">
              <div className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-text-primary">{formatDuration(elapsed)}</p>
                    <p className="text-[9px] text-text-tertiary uppercase">Time</p>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-text-primary">{distanceKm}</p>
                    <p className="text-[9px] text-text-tertiary uppercase">Distance (km)</p>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-text-primary">{speedKmh}</p>
                    <p className="text-[9px] text-text-tertiary uppercase">Speed (km/h)</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Stats view */
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <p className="text-[11px] text-error font-medium uppercase tracking-wider mb-1">Time Elapsed</p>
            <p className="text-5xl font-light text-text-primary tracking-tight">{formatDuration(elapsed)}</p>

            <div className="mt-8">
              <p className="text-4xl font-light text-text-primary tracking-tight text-center">{distanceKm}</p>
              <p className="text-[11px] text-primary font-medium uppercase tracking-wider text-center mt-1">Kilometers</p>
            </div>

            {/* Pace & Speed row */}
            <div className="flex items-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-lg font-light text-text-primary">{pace > 0 ? formatPace(pace) : '0.00'}</p>
                <p className="text-[10px] text-text-tertiary uppercase mt-0.5">Avg Pace</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-light text-text-primary">{speedKmh}</p>
                <p className="text-[10px] text-text-tertiary uppercase mt-0.5">Speed</p>
              </div>
            </div>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-5 py-5 bg-surface">
          <button
            onClick={handleStop}
            className="w-14 h-14 rounded-full bg-error flex items-center justify-center shadow-soft transition-all duration-200 active:scale-95"
          >
            <Square size={20} fill="white" className="text-white" />
          </button>
          <button
            onClick={handlePause}
            className="w-14 h-14 rounded-full bg-warning flex items-center justify-center shadow-soft transition-all duration-200 active:scale-95"
          >
            <Pause size={20} fill="white" className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // --- PAUSED (with map) ---
  if (state === 'paused') {
    return (
      <div className="page-enter flex flex-col h-[calc(100dvh-6rem)]">
        {/* Map */}
        <div className="flex-1 relative">
          <RunMap
            position={geo.position}
            path={geo.path}
            isTracking={false}
          />

          {/* Paused indicator */}
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-1.5 bg-warning text-white px-2.5 py-1 rounded-full text-[11px] font-medium shadow-soft">
              <Pause size={10} />
              Paused
            </div>
          </div>
        </div>

        {/* Bottom stats overlay */}
        <div className="bg-surface border-t border-border-light">
          <div className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-sm font-semibold text-text-primary">{formatDuration(elapsed)}</p>
                <p className="text-[9px] text-text-tertiary uppercase">Time</p>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-center flex-1">
                <p className="text-sm font-semibold text-text-primary">{distanceKm}</p>
                <p className="text-[9px] text-text-tertiary uppercase">Distance (km)</p>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-center flex-1">
                <p className="text-sm font-semibold text-text-primary">{pace > 0 ? formatPace(pace) : '--'}</p>
                <p className="text-[9px] text-text-tertiary uppercase">Pace</p>
              </div>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-5 py-5">
            <button
              onClick={handleStop}
              className="w-14 h-14 rounded-full bg-error flex items-center justify-center shadow-soft transition-all duration-200 active:scale-95"
            >
              <Square size={20} fill="white" className="text-white" />
            </button>
            <button
              onClick={handleResume}
              className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-gentle transition-all duration-200 active:scale-95"
            >
              <Play size={20} fill="white" className="text-white ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VALIDATING ---
  if (state === 'validating') {
    return (
      <div className="page-enter flex flex-col items-center justify-center h-[calc(100dvh-6rem)] px-10">
        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-8">
          <Zap size={36} className="text-primary" />
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-1">Validate your run...</h2>
        <p className="text-sm text-text-tertiary text-center mb-10 leading-relaxed">
          Checking GPS integrity and synchronizing with anti-cheat protocols.
        </p>

        {/* Steps */}
        <div className="w-full space-y-4">
          {validateSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
                {step.status === 'done' ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                ) : step.status === 'loading' ? (
                  <Loader2 size={18} className="text-primary animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border" />
                )}
              </div>
              <span className={cn(
                'text-sm',
                step.status === 'done' ? 'text-text-primary font-medium' :
                step.status === 'loading' ? 'text-primary font-medium' :
                'text-text-tertiary',
              )}>
                {step.label}{step.status === 'loading' ? '...' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- SUMMARY ---
  return (
    <div className="page-enter flex flex-col h-[calc(100dvh-6rem)] overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <button onClick={handleReset} className="p-1">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <span className="text-sm font-semibold text-text-primary">Summary</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 px-5 pt-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary">Great Job!</h2>
          <p className="text-sm text-text-tertiary mt-1">Run completed</p>
        </div>

        {/* Big distance */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-[11px] text-text-tertiary uppercase">Total Distance</span>
            <span className="text-[11px] text-primary font-semibold uppercase">Kilometers</span>
          </div>
          <p className="text-5xl font-light text-text-primary mt-2 tracking-tight">{distanceKm}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <SummaryStat
            icon={<Clock size={16} />}
            label="Total Time"
            value={formatDuration(elapsed)}
          />
          <SummaryStat
            icon={<Zap size={16} />}
            label="Avg Pace"
            value={pace > 0 ? formatPace(pace) : '--:--'}
          />
          <SummaryStat
            icon={<Mountain size={16} />}
            label="Elevation"
            value="0m"
          />
          <SummaryStat
            icon={<Flame size={16} />}
            label="Calories"
            value="0"
          />
        </div>

        {/* XP earned */}
        <Card className="flex items-center gap-3 !bg-primary-50 !border-primary-100 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">+100 XP Earned</p>
            <p className="text-xs text-text-tertiary">Pending verification</p>
          </div>
        </Card>
      </div>

      {/* Bottom action */}
      <div className="px-5 pb-6">
        <Button
          variant="primary"
          size="lg"
          className="w-full h-[52px] text-[15px] rounded-2xl"
          onClick={handleSubmit}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface-tertiary rounded-2xl p-4 text-center">
      <div className="text-text-tertiary mb-1.5 flex justify-center">{icon}</div>
      <p className="text-[11px] text-text-tertiary uppercase mb-0.5">{label}</p>
      <p className="text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}
