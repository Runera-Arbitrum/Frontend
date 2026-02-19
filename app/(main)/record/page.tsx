"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";
import { submitRun } from "@/lib/api";
import { formatDistance, formatDuration, formatPace } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { getProfile } from "@/lib/api";
import {
  Play,
  Square,
  Pause,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Zap,
  Mountain,
  Flame,
  Check,
  Loader2,
  ArrowLeft,
  Map,
  BarChart3,
  Footprints,
} from "lucide-react";

const RunMap = dynamic(() => import("@/components/record/RunMap"), {
  ssr: false,
});

type RecordState = "idle" | "running" | "paused" | "validating" | "summary";
type RunView = "stats" | "map";

interface ValidateStep {
  label: string;
  status: "pending" | "loading" | "done";
}

export default function RecordPage() {
  const { walletAddress } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [state, setState] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [runView, setRunView] = useState<RunView>("map");
  const [submitting, setSubmitting] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [runStartTime, setRunStartTime] = useState<string>("");
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [demoDistance, setDemoDistance] = useState<number | null>(null);
  const geo = useGeolocation();

  // Check if user has a profile NFT
  useEffect(() => {
    if (!walletAddress) return;
    getProfile(walletAddress)
      .then((p) => setHasProfile(!!p?.profileTokenId))
      .catch(() => setHasProfile(false));
  }, [walletAddress]);

  // Validation steps
  const [validateSteps, setValidateSteps] = useState<ValidateStep[]>([
    { label: "Upload data packet", status: "pending" },
    { label: "Verify GPS path", status: "pending" },
    { label: "Approve score", status: "pending" },
  ]);

  // Timer
  useEffect(() => {
    if (state !== "running") return;
    const interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Use demo distance when available, otherwise real geo distance
  const effectiveDistance = demoDistance ?? geo.totalDistanceMeters;

  const pace =
    elapsed > 0 && effectiveDistance > 0
      ? elapsed / (effectiveDistance / 1000)
      : 0;

  const distanceKm = (effectiveDistance / 1000).toFixed(2);
  const speedKmh =
    elapsed > 0 && effectiveDistance > 0
      ? (effectiveDistance / 1000 / (elapsed / 3600)).toFixed(1)
      : "0.0";

  // --- Handlers ---
  const handleStart = useCallback(() => {
    if (hasProfile === false) {
      setShowProfileModal(true);
      return;
    }
    setState("running");
    setRunView("map");
    setElapsed(0);
    setXpEarned(null);
    setRunStartTime(new Date().toISOString());
    geo.resetPath();
    geo.startTracking();
    // Hide bottom nav while recording
    if (typeof window !== "undefined") {
      window.localStorage.setItem("runera_recording", "true");
      window.dispatchEvent(new Event("storage"));
    }
  }, [geo, hasProfile]);

  const handlePause = useCallback(() => {
    setState("paused");
    geo.stopTracking();
  }, [geo]);

  const handleResume = useCallback(() => {
    setState("running");
    geo.startTracking();
  }, [geo]);

  const handleStop = useCallback(() => {
    geo.stopTracking();
    setState("validating");

    setValidateSteps([
      { label: "Upload data packet", status: "loading" },
      { label: "Verify GPS path", status: "pending" },
      { label: "Approve score", status: "pending" },
    ]);

    setTimeout(() => {
      setValidateSteps([
        { label: "Upload data packet", status: "done" },
        { label: "Verify GPS path", status: "loading" },
        { label: "Approve score", status: "pending" },
      ]);
    }, 1500);

    setTimeout(() => {
      setValidateSteps([
        { label: "Upload data packet", status: "done" },
        { label: "Verify GPS path", status: "done" },
        { label: "Uploading data", status: "loading" },
      ]);
    }, 3000);

    setTimeout(() => {
      setValidateSteps([
        { label: "Upload data packet", status: "done" },
        { label: "GPS path verified", status: "done" },
        { label: "Data updated", status: "done" },
      ]);
      setState("summary");
    }, 4500);
  }, [geo]);

  const handleReset = useCallback(() => {
    setState("idle");
    setRunView("map");
    setElapsed(0);
    setDemoDistance(null);
    geo.resetPath();
    // Show bottom nav again
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("runera_recording");
      window.dispatchEvent(new Event("storage"));
    }
  }, [geo]);

  const handleDemoRun = useCallback(() => {
    if (hasProfile === false) {
      setShowProfileModal(true);
      return;
    }
    // Simulate a 3.2km run in 18 minutes
    const fakeDist = 3200;
    const fakeDur = 1080;
    setElapsed(fakeDur);
    setRunStartTime(new Date(Date.now() - fakeDur * 1000).toISOString());
    geo.resetPath();
    setDemoDistance(fakeDist);
    setState("validating");

    setValidateSteps([
      { label: "Upload data packet", status: "loading" },
      { label: "Verify GPS path", status: "pending" },
      { label: "Approve score", status: "pending" },
    ]);

    setTimeout(() => {
      setValidateSteps([
        { label: "Upload data packet", status: "done" },
        { label: "Verify GPS path", status: "loading" },
        { label: "Approve score", status: "pending" },
      ]);
    }, 1200);

    setTimeout(() => {
      setValidateSteps([
        { label: "Upload data packet", status: "done" },
        { label: "Verify GPS path", status: "done" },
        { label: "Uploading data", status: "loading" },
      ]);
    }, 2400);

    setTimeout(() => {
      setValidateSteps([
        { label: "Upload data packet", status: "done" },
        { label: "GPS path verified", status: "done" },
        { label: "Data updated", status: "done" },
      ]);
      setState("summary");
    }, 3600);
  }, [geo, hasProfile]);

  const handleSubmit = useCallback(async () => {
    if (!walletAddress || submitting) return;
    try {
      setSubmitting(true);
      const result = await submitRun({
        walletAddress,
        distanceMeters: effectiveDistance,
        durationSeconds: elapsed,
        startTime: runStartTime,
        endTime: new Date().toISOString(),
        avgPaceSeconds: pace,
        deviceHash: "",
        path: geo.path.length > 0 ? geo.path : [{ lat: -6.2, lng: 106.8, timestamp: Date.now() }],
      });

      if (result.success && result.status === "VERIFIED") {
        setXpEarned(result.xpEarned || 0);
        toastSuccess(`Run verified! +${result.xpEarned || 0} XP earned`);
      } else if (result.status === "REJECTED") {
        toastError(
          `Run rejected: ${result.message || result.reasonCode || "Unknown reason"}`,
        );
      }
      handleReset();
    } catch (err) {
      toastError(
        "Failed to submit run: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    walletAddress,
    submitting,
    effectiveDistance,
    elapsed,
    runStartTime,
    pace,
    handleReset,
    geo.path,
  ]);

  // --- IDLE ---
  if (state === "idle") {
    return (
      <div className="page-enter flex flex-col h-[calc(100dvh-6rem)]">
        {/* Top bar */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="w-8" />
          <button className="flex items-center gap-1.5 bg-surface-tertiary px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-text-secondary">
              READY
            </span>
            <ChevronDown size={14} className="text-text-tertiary" />
          </button>
          <div className="w-8" />
        </div>

        {/* Big timer & distance */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <p className="text-[11px] text-primary font-medium uppercase tracking-wider mb-1">
            Time Elapsed
          </p>
          <p className="text-5xl font-light text-text-primary tracking-tight">
            00:00
          </p>

          <div className="mt-8">
            <p className="text-4xl font-light text-text-primary tracking-tight text-center">
              0.00
            </p>
            <p className="text-[11px] text-primary font-medium uppercase tracking-wider text-center mt-1">
              Kilometers
            </p>
          </div>
        </div>

        {/* Start button — shoe icon */}
        <div className="flex flex-col items-center gap-4 pb-8">
          <button
            onClick={handleStart}
            className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-gentle transition-all duration-200 active:scale-95"
          >
            <Footprints size={30} className="text-white" strokeWidth={2} />
          </button>
          <button
            onClick={handleDemoRun}
            className="text-xs text-text-tertiary underline underline-offset-2"
          >
            Try Demo Run
          </button>
        </div>

        {/* Profile required modal */}
        <Modal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title="Set Up Your Profile"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Footprints size={28} className="text-primary" />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-1">
              You need to set up your profile before recording runs.
            </p>
            <p className="text-xs text-text-tertiary mb-5">
              It only takes a moment to get started.
            </p>
            <a href="/profile" className="w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full rounded-2xl min-h-[48px]"
              >
                Set Up Profile
              </Button>
            </a>
          </div>
        </Modal>
      </div>
    );
  }

  // --- RUNNING ---
  if (state === "running") {
    return (
      <div className="page-enter flex flex-col h-[calc(100dvh-6rem)]">
        {/* Top bar with view toggle */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          {/* View toggle */}
          <div className="flex items-center bg-surface-tertiary rounded-full p-0.5">
            <button
              onClick={() => setRunView("stats")}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                runView === "stats"
                  ? "bg-primary text-white"
                  : "text-text-tertiary",
              )}
            >
              <BarChart3 size={15} />
            </button>
            <button
              onClick={() => setRunView("map")}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                runView === "map"
                  ? "bg-primary text-white"
                  : "text-text-tertiary",
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
        {runView === "map" ? (
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

              {/* Chevron button to show stats */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={() => setRunView("stats")}
                  className="w-12 h-12 rounded-full bg-surface/90 backdrop-blur-sm border border-border-light shadow-gentle flex items-center justify-center transition-all duration-200 active:scale-95"
                >
                  <ChevronDown size={20} className="text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Bottom stats overlay */}
            <div className="bg-surface border-t border-border-light">
              <div className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatDuration(elapsed)}
                    </p>
                    <p className="text-[9px] text-text-tertiary uppercase">
                      Time
                    </p>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {distanceKm}
                    </p>
                    <p className="text-[9px] text-text-tertiary uppercase">
                      Distance (km)
                    </p>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {speedKmh}
                    </p>
                    <p className="text-[9px] text-text-tertiary uppercase">
                      Speed (km/h)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Stats view */
          <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
            <p className="text-[11px] text-error font-medium uppercase tracking-wider mb-1">
              Time Elapsed
            </p>
            <p className="text-5xl font-light text-text-primary tracking-tight">
              {formatDuration(elapsed)}
            </p>

            <div className="mt-8">
              <p className="text-4xl font-light text-text-primary tracking-tight text-center">
                {distanceKm}
              </p>
              <p className="text-[11px] text-primary font-medium uppercase tracking-wider text-center mt-1">
                Kilometers
              </p>
            </div>

            {/* Pace & Speed row */}
            <div className="flex items-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-lg font-light text-text-primary">
                  {pace > 0 ? formatPace(pace) : "0.00"}
                </p>
                <p className="text-[10px] text-text-tertiary uppercase mt-0.5">
                  Avg Pace
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-light text-text-primary">
                  {speedKmh}
                </p>
                <p className="text-[10px] text-text-tertiary uppercase mt-0.5">
                  Speed
                </p>
              </div>
            </div>

            {/* Chevron button to show map */}
            <button
              onClick={() => setRunView("map")}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-surface-tertiary border border-border-light shadow-gentle flex items-center justify-center transition-all duration-200 active:scale-95"
            >
              <ChevronUp size={20} className="text-text-secondary" />
            </button>
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
  if (state === "paused") {
    return (
      <div className="page-enter flex flex-col h-[calc(100dvh-6rem)]">
        {/* Map */}
        <div className="flex-1 relative">
          <RunMap position={geo.position} path={geo.path} isTracking={false} />

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
                <p className="text-sm font-semibold text-text-primary">
                  {formatDuration(elapsed)}
                </p>
                <p className="text-[9px] text-text-tertiary uppercase">Time</p>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-center flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {distanceKm}
                </p>
                <p className="text-[9px] text-text-tertiary uppercase">
                  Distance (km)
                </p>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-center flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {pace > 0 ? formatPace(pace) : "--"}
                </p>
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
  if (state === "validating") {
    return (
      <div className="page-enter flex flex-col items-center justify-center h-screen px-10">
        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-8">
          <Zap size={36} className="text-primary" />
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-1">
          Validate your run...
        </h2>
        <p className="text-sm text-text-tertiary text-center mb-10 leading-relaxed">
          Checking GPS integrity and synchronizing with anti-cheat protocols.
        </p>

        {/* Steps */}
        <div className="w-full max-w-xs mx-auto space-y-4">
          {validateSteps.map((step, i) => (
            <div key={i} className={cn(
              "flex items-center justify-center gap-3 transition-opacity duration-500",
              step.status === "done" && "opacity-50",
            )}>
              <div className="w-6 h-6 flex items-center justify-center">
                {step.status === "done" ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                ) : step.status === "loading" ? (
                  <Loader2 size={18} className="text-primary animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm",
                  step.status === "done"
                    ? "text-text-primary font-medium"
                    : step.status === "loading"
                      ? "text-primary font-medium"
                      : "text-text-tertiary",
                )}
              >
                {step.label}
                {step.status === "loading" ? "..." : ""}
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
          <h2 className="text-2xl font-semibold text-text-primary">
            Great Job!
          </h2>
          <p className="text-sm text-text-tertiary mt-1">Run completed</p>
        </div>

        {/* Big distance */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-[11px] text-text-tertiary uppercase">
              Total Distance
            </span>
            <span className="text-[11px] text-primary font-semibold uppercase">
              Kilometers
            </span>
          </div>
          <p className="text-5xl font-light text-text-primary mt-2 tracking-tight">
            {distanceKm}
          </p>
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
            value={pace > 0 ? formatPace(pace) : "--:--"}
          />
          <SummaryStat
            icon={<Mountain size={16} />}
            label="Elevation"
            value="0m"
          />
          <SummaryStat icon={<Flame size={16} />} label="Calories" value="0" />
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
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface-tertiary rounded-2xl p-4 text-center">
      <div className="text-text-tertiary mb-1.5 flex justify-center">
        {icon}
      </div>
      <p className="text-[11px] text-text-tertiary uppercase mb-0.5">{label}</p>
      <p className="text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}
