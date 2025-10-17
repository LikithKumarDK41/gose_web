"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, StopCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  selectNav,
  startTour as navStart,
  pauseTour as navPause,
  resumeTour as navResume,
  stopTour as navStop,
  setProfile,
  setActiveTour,
} from "@/lib/store/slices/navSlice";
import { resetAll as resetGeofence } from "@/lib/store/slices/geofenceSlice";
import { useLocale } from "@/providers/LocaleProvider";
import { toast } from "sonner";

/* ----------------------------------------------------------------
   🧩 Props
---------------------------------------------------------------- */
type Props = {
  tourId?: string;
  defaultProfile?: "walking" | "driving" | "cycling";
  autoStart?: boolean;
};

/* ----------------------------------------------------------------
   🚀 Component
---------------------------------------------------------------- */
export default function NavigationOverlay({
  tourId,
  defaultProfile = "walking",
  autoStart = false,
}: Props) {
  const router = useRouter();
  const { show } = useGlobalLoader();
  const nav = useAppSelector(selectNav);
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();

  /* ----------------------------------------------------------------
     ✅ 1. Restore state after reload or back
  ---------------------------------------------------------------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("navState");
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (!parsed?.tourId) return;

      dispatch(setActiveTour(parsed.tourId));
      dispatch(setProfile(parsed.profile ?? defaultProfile));

      if (parsed.status === "running") {
        dispatch(navStart(parsed.tourId));
        toast.success("✅ Tour resumed");
      } else if (parsed.status === "paused") {
        dispatch(navPause());
      }
    } catch (err) {
      console.warn("⚠️ Failed to restore nav state:", err);
    }
  }, [dispatch, defaultProfile]);

  /* ----------------------------------------------------------------
     ✅ 2. Persist state in localStorage
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (nav.status === "idle") {
      localStorage.removeItem("navState");
      return;
    }

    localStorage.setItem(
      "navState",
      JSON.stringify({
        status: nav.status,
        tourId: nav.activeTourId,
        profile: nav.profile,
      })
    );
  }, [nav.status, nav.activeTourId, nav.profile]);

  /* ----------------------------------------------------------------
     ✅ 3. Auto-start for tour detail auto play
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (autoStart && nav.status === "idle" && tourId) {
      dispatch(setActiveTour(tourId));
      dispatch(setProfile(defaultProfile));
      dispatch(navStart(tourId));
    }
  }, [autoStart, nav.status, tourId, defaultProfile, dispatch]);

  /* ----------------------------------------------------------------
     ✅ 4. Auto pause/resume on tab visibility change
  ---------------------------------------------------------------- */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const saved = localStorage.getItem("navState");
      if (document.visibilityState === "hidden" && nav.status === "running") {
        dispatch(navPause());
        localStorage.setItem(
          "navState",
          JSON.stringify({
            status: "paused",
            tourId: nav.activeTourId,
            profile: nav.profile,
          })
        );
        toast.warning("⏸️ Tour paused (tab inactive)");
      } else if (document.visibilityState === "visible") {
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.status === "paused" && parsed?.tourId) {
          dispatch(navResume());
          toast.success("▶️ Tour resumed");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch, nav.status, nav.activeTourId, nav.profile]);

  /* ----------------------------------------------------------------
     ✅ 5. Control handlers
  ---------------------------------------------------------------- */
  const handleStart = () => {
    if (nav.status === "running") return;
    if (tourId) dispatch(setActiveTour(tourId));
    dispatch(setProfile(defaultProfile));
    dispatch(navStart(tourId));
    toast.success("🎯 Tour started");
  };

  const handlePauseResume = () => {
    if (nav.status === "running") {
      dispatch(navPause());
      toast.warning("⏸️ Tour paused");
    } else if (nav.status === "paused") {
      dispatch(navResume());
      toast.success("▶️ Tour resumed");
    }
  };

  const handleStop = () => {
    dispatch(navStop());
    dispatch(resetGeofence());
    localStorage.removeItem("navState");
    toast.info("🛑 Tour stopped");
  };

  const handleBack = () => {
    show();
    dispatch(navStop());
    dispatch(resetGeofence());
    localStorage.removeItem("navState");
    requestAnimationFrame(() => router.back());
  };

  /* ----------------------------------------------------------------
     ✅ 6. Localized labels
  ---------------------------------------------------------------- */
  const labels = {
    back: t("Back") || (locale === "ja" ? "戻る" : "Back"),
    start: t("Start") || (locale === "ja" ? "開始" : "Start"),
    pause: t("Pause") || (locale === "ja" ? "一時停止" : "Pause"),
    resume: t("Resume") || (locale === "ja" ? "再開" : "Resume"),
    stop: t("Stop") || (locale === "ja" ? "停止" : "Stop"),
  };

  /* ----------------------------------------------------------------
     ✅ 7. Render UI
  ---------------------------------------------------------------- */
  return (
    <>
      {/* 🔙 Back button */}
      <div className="fixed left-3 top-3 z-[60]">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full shadow bg-white/80 dark:bg-black/50 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-black/60"
          onClick={handleBack}
          aria-label={labels.back}
          title={labels.back}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* 🎯 Bottom Navigation Controls */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center gap-3">
        {/* 🚀 Idle → show Start */}
        {nav.status === "idle" && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
            onClick={handleStart}
            aria-label={labels.start}
          >
            <Play className="mr-2 h-5 w-5" /> {labels.start}
          </Button>
        )}

        {/* 🟢 Running → show Pause + Stop */}
        {nav.status === "running" && (
          <>
            <Button
              size="lg"
              variant="outline"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-white/90 dark:bg-black/40 backdrop-blur-sm"
              onClick={handlePauseResume}
              aria-label={labels.pause}
            >
              <Pause className="mr-2 h-5 w-5" /> {labels.pause}
            </Button>

            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
              onClick={handleStop}
              aria-label={labels.stop}
            >
              <StopCircle className="mr-2 h-5 w-5" /> {labels.stop}
            </Button>
          </>
        )}

        {/* 🟠 Paused → show Resume + Stop */}
        {nav.status === "paused" && (
          <>
            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              onClick={handlePauseResume}
              aria-label={labels.resume}
            >
              <Play className="mr-2 h-5 w-5" /> {labels.resume}
            </Button>

            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
              onClick={handleStop}
              aria-label={labels.stop}
            >
              <StopCircle className="mr-2 h-5 w-5" /> {labels.stop}
            </Button>
          </>
        )}
      </div>
    </>
  );
}
