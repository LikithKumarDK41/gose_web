"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, StopCircle, ArrowLeft, AlertTriangle } from "lucide-react";
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
  syncUserTourStatus,
} from "@/lib/store/slices/navSlice";
import { resetAll as resetGeofence } from "@/lib/store/slices/geofenceSlice";
import { useLocale } from "@/providers/LocaleProvider";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Props = {
  tourId?: string;
  defaultProfile?: "walking" | "driving" | "cycling";
  autoStart?: boolean;
  listOpen?: boolean;
  onOpenList?: () => void;
  onCloseList?: () => void;
};

/* ---------------- helpers ---------------- */
function normalizeLngLat(
  loc?: [number, number] | { lat?: number; lng?: number } | null
): { lat: number; lng: number } | null {
  if (!loc) return null;
  if (Array.isArray(loc) && loc.length >= 2) {
    const [lng, lat] = loc;
    return typeof lng === "number" && typeof lat === "number" ? { lat, lng } : null;
  }
  if (typeof loc === "object" && loc !== null) {
    const { lat, lng } = loc as any;
    return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;
  }
  return null;
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

async function getOneShotLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!("geolocation" in navigator)) return null;

  // Try to preflight permission where supported (ignore errors)
  try {
    // @ts-ignore
    if ("permissions" in navigator) {
      // @ts-ignore
      const p = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      if (p.state === "denied") return null;
    }
  } catch {}

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

export default function NavigationOverlay({
  tourId,
  defaultProfile = "walking",
  autoStart = false,
  listOpen = false,
  onOpenList,
  onCloseList,
}: Props) {
  const router = useRouter();
  const { show } = useGlobalLoader();
  const nav = useAppSelector(selectNav);
  const auth = useAppSelector((s) => s.auth);
  const geofence = useAppSelector((s) => s.geofence);
  const tours = useAppSelector((s) => s.tourist.list);
  const detail = useAppSelector((s) => s.tourist.detail);
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();

  const [showDialog, setShowDialog] = useState(false);

  const toSyncLoc = (p: { lat: number; lng: number } | null): [string, string] => {
    const loc = p || { lat: 0, lng: 0 };
    return [String(loc.lng), String(loc.lat)];
  };

  // region check using monument.georadius || 50
  function isInsideRegion(
    user: { lat: number; lng: number },
    tourpoints: any[]
  ) {
    if (!tourpoints?.length) return false;
    for (const p of tourpoints) {
      const pos = normalizeLngLat(p?.monument?.location ?? p?.location);
      if (!pos) continue;
      const geoRadius =
        typeof p?.monument?.georadius === "number" && p.monument.georadius > 0
          ? p.monument.georadius
          : 50;
      if (haversineMeters(user, pos) <= geoRadius) return true;
    }
    return false;
  }

  /* restore */
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
      console.warn("restore nav state:", err);
    }
  }, [dispatch, defaultProfile]);

  /* persist */
  useEffect(() => {
    if (nav.status === "idle") {
      localStorage.removeItem("navState");
      return;
    }
    localStorage.setItem(
      "navState",
      JSON.stringify({ status: nav.status, tourId: nav.activeTourId, profile: nav.profile })
    );
  }, [nav.status, nav.activeTourId, nav.profile]);

  /* auto start */
  useEffect(() => {
    if (autoStart && nav.status === "idle" && tourId) {
      dispatch(setActiveTour(tourId));
      dispatch(setProfile(defaultProfile));
      dispatch(navStart(tourId));
      const loc = geofence.last || null;
      if (auth.data?.user?._id) {
        dispatch(
          syncUserTourStatus({
            userId: auth.data.user._id,
            tourId,
            status: "start",
            location: toSyncLoc(loc),
          })
        );
      }
    }
  }, [autoStart, nav.status, tourId, defaultProfile, dispatch, auth.data, geofence.last]);

  /* pause/resume on tab hide/show */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const saved = localStorage.getItem("navState");
      if (document.visibilityState === "hidden" && nav.status === "running") {
        dispatch(navPause());
        localStorage.setItem(
          "navState",
          JSON.stringify({ status: "paused", tourId: nav.activeTourId, profile: nav.profile })
        );
        toast.warning("⏸️ Tour paused (tab inactive)");

        if (auth.data?.user?._id && nav.activeTourId) {
          const loc = geofence.last || null;
          dispatch(
            syncUserTourStatus({
              userId: auth.data.user._id,
              tourId: nav.activeTourId,
              status: "pause",
              location: toSyncLoc(loc),
            })
          );
        }
      } else if (document.visibilityState === "visible") {
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.status === "paused" && parsed?.tourId) {
          dispatch(navResume());
          toast.success("▶️ Tour resumed");

          if (auth.data?.user?._id) {
            const loc = geofence.last || null;
            dispatch(
              syncUserTourStatus({
                userId: auth.data.user._id,
                tourId: parsed.tourId,
                status: "start",
                location: toSyncLoc(loc),
              })
            );
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [dispatch, nav.status, nav.activeTourId, nav.profile, auth.data, geofence.last]);

  /* controls */
  const handleStart = async () => {
    if (nav.status === "running" || !tourId) return;

    // pick the tour instance
    const tour =
      tours.find((t) => t._id === tourId) ||
      (detail?._id === tourId ? detail : null);

    if (!tour?.tourpoints?.length) {
      toast.error("⚠️ Tourpoints not available yet");
      return;
    }

    // compute a reasonable fallback point from the tour (first point)
    const firstPos =
      normalizeLngLat(
        tour.tourpoints[0]?.monument?.location ?? tour.tourpoints[0]?.location
      ) || null;

    // get best available location: redux -> one-shot gps -> first tourpoint
    let userLoc = geofence.last || null;
    let source: "redux" | "gps" | "first" | null = null;

    if (userLoc) {
      source = "redux";
    } else {
      const gps = await getOneShotLocation();
      if (gps) {
        userLoc = gps;
        source = "gps";
      } else if (firstPos) {
        userLoc = firstPos;
        source = "first";
      }
    }

    if (!userLoc) {
      toast.error(
        "⚠️ Couldn’t get your location. Enable GPS/HTTPS or move near a tour point."
      );
      return;
    }

    // Region check (monument.georadius || 50)
    const inside = isInsideRegion(userLoc, tour.tourpoints);
    if (!inside) {
      setShowDialog(true);
      return;
    }

    // Start the tour
    dispatch(setActiveTour(tourId));
    dispatch(setProfile(defaultProfile));
    dispatch(navStart(tourId));
    toast.success(
      source === "gps"
        ? "🎯 Tour started (using GPS)"
        : source === "redux"
        ? "🎯 Tour started"
        : "🎯 Tour started (using nearest point)"
    );

    if (auth.data?.user?._id) {
      dispatch(
        syncUserTourStatus({
          userId: auth.data.user._id,
          tourId,
          status: "start",
          location: toSyncLoc(userLoc),
        })
      );
    }
  };

  const handlePauseResume = () => {
    if (!tourId) return;
    if (nav.status === "running") {
      dispatch(navPause());
      toast.warning("⏸️ Tour paused");
      if (auth.data?.user?._id) {
        const loc = geofence.last || null;
        dispatch(
          syncUserTourStatus({
            userId: auth.data.user._id,
            tourId,
            status: "pause",
            location: toSyncLoc(loc),
          })
        );
      }
    } else if (nav.status === "paused") {
      dispatch(navResume());
      toast.success("▶️ Tour resumed");
      if (auth.data?.user?._id) {
        const loc = geofence.last || null;
        dispatch(
          syncUserTourStatus({
            userId: auth.data.user._id,
            tourId,
            status: "start",
            location: toSyncLoc(loc),
          })
        );
      }
    }
  };

  const handleStop = () => {
    if (!tourId) return;
    dispatch(navStop());
    dispatch(resetGeofence());
    localStorage.removeItem("navState");
    toast.info("🛑 Tour stopped");
    if (auth.data?.user?._id) {
      const loc = geofence.last || null;
      dispatch(
        syncUserTourStatus({
          userId: auth.data.user._id,
          tourId,
          status: "end",
          location: toSyncLoc(loc),
        })
      );
    }
  };

  const handleBack = () => {
    const { show } = useGlobalLoader();
    show();
    requestAnimationFrame(() => router.back());
  };

  const { back, start, pause, resume, stop, map, list } = {
    back: t("Back") || (locale === "ja" ? "戻る" : "Back"),
    start: t("Start") || (locale === "ja" ? "開始" : "Start"),
    pause: t("Pause") || (locale === "ja" ? "一時停止" : "Pause"),
    resume: t("Resume") || (locale === "ja" ? "再開" : "Resume"),
    stop: t("Stop") || (locale === "ja" ? "停止" : "Stop"),
    map: t("Map") || (locale === "ja" ? "地図" : "Map"),
    list: t("List") || (locale === "ja" ? "一覧" : "List"),
  };

  return (
    <>
      {/* Back button */}
      <div className="fixed left-3 top-3 z-[60]">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full shadow bg-white/80 dark:bg-black/50 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-black/60"
          onClick={handleBack}
          aria-label={back}
          title={back}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Map/List toggle */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center rounded-full border bg-white/80 dark:bg-black/50 backdrop-blur px-1 py-1 shadow">
          <button
            type="button"
            onClick={onCloseList}
            aria-pressed={!listOpen}
            className={[
              "px-3 py-1.5 rounded-full text-sm transition",
              !listOpen
                ? "bg-sky-600 text-white"
                : "text-foreground/80 hover:bg-white/70 dark:hover:bg-black/40",
            ].join(" ")}
          >
            {map}
          </button>
          <button
            type="button"
            onClick={onOpenList}
            aria-pressed={listOpen}
            className={[
              "px-3 py-1.5 rounded-full text-sm transition",
              listOpen
                ? "bg-sky-600 text-white"
                : "text-foreground/80 hover:bg-white/70 dark:hover:bg-black/40",
            ].join(" ")}
          >
            {list}
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center gap-3">
        {nav.status === "idle" && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
            onClick={handleStart}
            aria-label={start}
          >
            <Play className="mr-2 h-5 w-5" /> {start}
          </Button>
        )}

        {nav.status === "running" && (
          <>
            <Button
              size="lg"
              variant="outline"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-white/90 dark:bg-black/40 backdrop-blur-sm"
              onClick={handlePauseResume}
              aria-label={pause}
            >
              <Pause className="mr-2 h-5 w-5" /> {pause}
            </Button>
            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
              onClick={handleStop}
              aria-label={stop}
            >
              <StopCircle className="mr-2 h-5 w-5" /> {stop}
            </Button>
          </>
        )}

        {nav.status === "paused" && (
          <>
            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              onClick={handlePauseResume}
              aria-label={resume}
            >
              <Play className="mr-2 h-5 w-5" /> {resume}
            </Button>
            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
              onClick={handleStop}
              aria-label={stop}
            >
              <StopCircle className="mr-2 h-5 w-5" /> {stop}
            </Button>
          </>
        )}
      </div>

      {/* Out-of-region dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              You’re not in the region
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Please move closer to one of the tour’s points to begin your trip.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-full">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
