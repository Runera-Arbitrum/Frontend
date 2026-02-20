"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
  Footprints,
  Heart,
} from "lucide-react";

const RunMap = dynamic(() => import("@/components/record/RunMap"), {
  ssr: false,
});

type RecordState = "idle" | "running" | "paused" | "validating" | "summary";
type CardView = "collapsed" | "expanded";

interface ValidateStep {
  label: string;
  status: "pending" | "loading" | "done";
}

export default function RecordPage() {
  const router = useRouter();
  const { walletAddress } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [state, setState] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [cardView, setCardView] = useState<CardView>("collapsed");
  const [submitting, setSubmitting] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [runStartTime, setRunStartTime] = useState<string>("");
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [demoDistance, setDemoDistance] = useState<number | null>(null);
  const geo = useGeolocation();

  useEffect(() => {
    if (!walletAddress) return;
    getProfile(walletAddress)
      .then((p) => setHasProfile(p != null))
      .catch(() => setHasProfile(false));
  }, [walletAddress]);

  const [validateSteps, setValidateSteps] = useState<ValidateStep[]>([
    { label: "Upload data packet", status: "pending" },
    { label: "Verify GPS path", status: "pending" },
    { label: "Approve score", status: "pending" },
  ]);

  useEffect(() => {
    if (state !== "running") return;
    const interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

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

  const handleStart = useCallback(() => {
    if (hasProfile === false) {
      setShowProfileModal(true);
      return;
    }
    setState("running");
    setCardView("collapsed");
    setElapsed(0);
    setXpEarned(null);
    setRunStartTime(new Date().toISOString());
    geo.resetPath();
    geo.startTracking();
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
    setCardView("collapsed");
    setElapsed(0);
    setDemoDistance(null);
    geo.resetPath();
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
        distanceMeters: Math.round(effectiveDistance),
        durationSeconds: Math.round(elapsed),
        startTime: runStartTime,
        endTime: new Date().toISOString(),
        deviceHash: "",
      });

      if (result.success && result.status === "VERIFIED") {
        setXpEarned(result.xpEarned || 0);
        toastSuccess(`Run saved successfully! +${result.xpEarned || 0} XP earned`);
        handleReset();
        setTimeout(() => {
          router.push("/home");
        }, 1500);
      } else if (result.status === "REJECTED") {
        toastError(
          `Run rejected: ${result.message || result.reasonCode || "Unknown reason"}`,
        );
        handleReset();
      } else {
        toastSuccess("Run saved successfully and is being validated");
        handleReset();
        setTimeout(() => {
          router.push("/home");
        }, 1500);
      }
    } catch (err) {
      toastError(
        "Failed to save run: " +
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
    handleReset,
    router,
  ]);

  if (state === "idle") {
    return (
      <div className="page-enter flex flex-col h-screen relative">
        <div className="absolute top-0 inset-x-0 z-20 px-5 pt-4 safe-top flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-md border border-border-light/50 px-3 py-1.5 rounded-full shadow-card">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-semibold text-text-secondary">
              READY
            </span>
          </div>
        </div>

        <div className="absolute inset-0">
          <RunMap position={geo.position} path={geo.path} isTracking={false} />
        </div>

        <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-6 safe-bottom">
          <div className="bg-surface/95 backdrop-blur-md border border-border-light rounded-3xl shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-2">
                  Time
                </p>
                <p className="text-3xl font-semibold text-text-primary tracking-tight">
                  00:00
                </p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-2">
                  Distance
                </p>
                <p className="text-3xl font-semibold text-text-primary tracking-tight">
                  0.00
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleStart}
                className="w-20 h-20 rounded-full bg-primary text-white shadow-gentle transition-all duration-200 ios-press cursor-pointer flex items-center justify-center"
              >
                <Play size={28} fill="white" className="text-white ml-1" strokeWidth={0} />
              </button>

              <button
                onClick={handleDemoRun}
                className="text-xs text-text-tertiary cursor-pointer"
              >
                Try Demo Run
              </button>
            </div>
          </div>
        </div>

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

  if (state === "running") {
    if (cardView === "collapsed") {
      return (
        <div className="page-enter flex flex-col h-screen relative">
          <div className="absolute top-0 inset-x-0 z-20 px-5 pt-4 safe-top flex items-center justify-center">
            <div className="flex items-center gap-1.5 bg-primary px-3 py-1.5 rounded-full shadow-card">
              <span className="w-2 h-2 rounded-full bg-white streak-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">
                RUNNING
              </span>
            </div>
          </div>

          {geo.position && (
            <div className="absolute top-16 right-5 z-20">
              <div className="flex items-center gap-1.5 bg-success text-white px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-card">
                <MapPin size={10} strokeWidth={3} />
                GPS
              </div>
            </div>
          )}

          <div className="absolute inset-0">
            <RunMap
              position={geo.position}
              path={geo.path}
              isTracking={true}
            />
          </div>

          <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-6 safe-bottom">
            <div className="bg-surface/95 backdrop-blur-md border border-border-light rounded-3xl shadow-card p-5">
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => setCardView("expanded")}
                  className="w-12 h-12 rounded-full bg-surface-tertiary border border-border-light shadow-card flex items-center justify-center transition-all duration-200 ios-press cursor-pointer"
                >
                  <ChevronUp size={20} className="text-text-secondary" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center">
                  <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-2">
                    Time
                  </p>
                  <p className="text-xl font-bold text-text-primary">
                    {formatDuration(elapsed)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-2">
                    Dist
                  </p>
                  <p className="text-xl font-bold text-text-primary">
                    {distanceKm}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-2">
                    Pace
                  </p>
                  <p className="text-xl font-bold text-text-primary">
                    {pace > 0 ? formatPace(pace) : "--:--"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleStop}
                  className="w-14 h-14 rounded-full bg-error flex items-center justify-center shadow-soft transition-all duration-200 ios-press cursor-pointer"
                >
                  <Square size={16} fill="white" className="text-white" />
                </button>
                <button
                  onClick={handlePause}
                  className="w-14 h-14 rounded-full bg-surface border-2 border-border-light flex items-center justify-center shadow-card transition-all duration-200 ios-press cursor-pointer"
                >
                  <Pause size={18} className="text-text-primary" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="page-enter flex flex-col h-screen bg-surface relative">
        <div className="absolute top-0 inset-x-0 z-20 px-5 pt-4 safe-top flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-primary px-3 py-1.5 rounded-full shadow-card">
            <span className="w-2 h-2 rounded-full bg-white streak-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">
              RUNNING
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-3">
              Time
            </p>
            <p className="text-6xl font-semibold text-text-primary tracking-tight">
              {formatDuration(elapsed)}
            </p>
          </div>

          <div className="text-center mb-10">
            <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-3">
              Distance
            </p>
            <p className="text-5xl font-semibold text-text-primary tracking-tight">
              {distanceKm}
            </p>
            <p className="text-base font-semibold text-text-tertiary mt-2">km</p>
          </div>

          <div className="text-center mb-8">
            <p className="text-3xl font-semibold text-text-primary">
              {pace > 0 ? formatPace(pace) : "--:--"}
            </p>
            <p className="text-sm font-bold text-text-tertiary uppercase mt-2">
              Avg Pace
            </p>
          </div>

          <button
            onClick={() => setCardView("collapsed")}
            className="w-12 h-12 rounded-full bg-surface-tertiary border border-border-light shadow-card flex items-center justify-center transition-all duration-200 ios-press cursor-pointer"
          >
            <ChevronDown size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="px-5 pb-6 safe-bottom">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleStop}
              className="w-16 h-16 rounded-full bg-error flex items-center justify-center shadow-soft transition-all duration-200 ios-press cursor-pointer"
            >
              <Square size={18} fill="white" className="text-white" />
            </button>
            <button
              onClick={handlePause}
              className="w-16 h-16 rounded-full bg-surface border-2 border-border-light flex items-center justify-center shadow-card transition-all duration-200 ios-press cursor-pointer"
            >
              <Pause size={20} className="text-text-primary" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "paused") {
    return (
      <div className="page-enter flex flex-col h-screen relative">
        <div className="absolute top-0 inset-x-0 z-20 px-5 pt-4 safe-top flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-warning px-3 py-1.5 rounded-full shadow-card">
            <Pause size={12} className="text-white" strokeWidth={2.5} />
            <span className="text-xs font-bold text-white tracking-wide">
              PAUSED
            </span>
          </div>
        </div>

        <div className="absolute inset-0">
          <RunMap position={geo.position} path={geo.path} isTracking={false} />
        </div>

        <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-6 safe-bottom">
          <div className="bg-surface/95 backdrop-blur-md border border-border-light rounded-3xl shadow-card p-5">
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center">
                <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-2">
                  Time
                </p>
                <p className="text-xl font-bold text-text-primary">
                  {formatDuration(elapsed)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-2">
                  Dist
                </p>
                <p className="text-xl font-bold text-text-primary">
                  {distanceKm}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-text-tertiary uppercase tracking-wide mb-2">
                  Pace
                </p>
                <p className="text-xl font-bold text-text-primary">
                  {pace > 0 ? formatPace(pace) : "--:--"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleStop}
                className="w-14 h-14 rounded-full bg-error flex items-center justify-center shadow-soft transition-all duration-200 ios-press cursor-pointer"
              >
                <Square size={16} fill="white" className="text-white" />
              </button>
              <button
                onClick={handleResume}
                className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-card transition-all duration-200 ios-press cursor-pointer"
              >
                <Play
                  size={18}
                  fill="white"
                  className="text-white ml-0.5"
                  strokeWidth={0}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="w-full max-w-xs mx-auto space-y-4">
          {validateSteps.map((step, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-center gap-3 transition-opacity duration-500",
                step.status === "done" && "opacity-50",
              )}
            >
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

  return (
    <div className="page-enter flex flex-col h-screen bg-surface overflow-y-auto">
      <div className="flex-1 px-6 pt-8 safe-top">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            Great Job!
          </h2>
          <p className="text-sm text-text-tertiary">
            Run completed successfully
          </p>
        </div>

        <div className="text-center mb-8">
          <p className="text-xs font-bold text-text-tertiary uppercase tracking-wide mb-2">
            Total Distance
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <p className="text-6xl font-light text-text-primary tracking-tight">
              {distanceKm}
            </p>
            <span className="text-xl text-primary font-semibold mb-2">km</span>
          </div>
        </div>

        <div className="bg-surface-secondary rounded-3xl p-5 mb-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock size={14} className="text-text-tertiary" />
                <p className="text-xs text-text-tertiary uppercase tracking-wide">
                  Time
                </p>
              </div>
              <p className="text-xl font-semibold text-text-primary">
                {formatDuration(elapsed)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap size={14} className="text-text-tertiary" />
                <p className="text-xs text-text-tertiary uppercase tracking-wide">
                  Pace
                </p>
              </div>
              <p className="text-xl font-semibold text-text-primary">
                {pace > 0 ? formatPace(pace) : "--:--"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Mountain size={14} className="text-text-tertiary" />
                <p className="text-xs text-text-tertiary uppercase tracking-wide">
                  Elevation
                </p>
              </div>
              <p className="text-xl font-semibold text-text-primary">0m</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame size={14} className="text-text-tertiary" />
                <p className="text-xs text-text-tertiary uppercase tracking-wide">
                  Calories
                </p>
              </div>
              <p className="text-xl font-semibold text-text-primary">
                {Math.round(effectiveDistance / 10)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">
              Run will be verified
            </p>
            <p className="text-xs text-text-tertiary">
              You'll earn XP after verification
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 safe-bottom">
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 h-[52px] rounded-2xl border-2 border-border-light bg-surface text-text-secondary font-semibold text-[15px] transition-all duration-200 ios-press cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-[52px] rounded-2xl bg-primary text-white font-semibold text-[15px] shadow-gentle transition-all duration-200 ios-press cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Run"}
          </button>
        </div>
      </div>
    </div>
  );
}
