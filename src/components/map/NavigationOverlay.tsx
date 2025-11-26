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
  setStatus,
  syncUserTourStatus,
} from "@/lib/store/slices/navSlice";
import { resetAll as resetGeofence } from "@/lib/store/slices/geofenceSlice";

import { apiGetUserTourStatus } from "@/services/userNavService";
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
  listOpen?: boolean;
  onOpenList?: () => void;
  onCloseList?: () => void;
};

/* =========================================================
   🌍 Helpers
========================================================= */
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

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

/* =========================================================
   🧭 Component
========================================================= */
export default function NavigationOverlay({
  tourId,
  defaultProfile = "walking",
  listOpen = false,
  onOpenList,
  onCloseList,
}: Props) {
  const router = useRouter();
  const loader = useGlobalLoader();
  const nav = useAppSelector(selectNav);
  const auth = useAppSelector((s) => s.auth);
  const geofence = useAppSelector((s) => s.geofence);
  const detail = useAppSelector((s) => s.tourist.detail);

  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();

  const [showDialog, setShowDialog] = useState(false);

  const toSyncLoc = (p: { lat: number; lng: number } | null): [string, string] => {
    const loc = p || { lat: 0, lng: 0 };
    return [String(loc.lng), String(loc.lat)];
  };

  function isInsideRegion(user: { lat: number; lng: number }, tourpoints: any[]) {
    if (!tourpoints?.length) return false;
    for (const p of tourpoints) {
      const pos = normalizeLngLat(p?.monument?.location ?? p?.location);
      if (!pos) continue;

      const radius = typeof p?.monument?.georadius === "number" ? p.monument.georadius : 50;

      if (haversineMeters(user, pos) <= radius) return true;
    }
    return false;
  }

  /* =========================================================
     ⭐ Load tour status from backend on mount
     Backend decides UI controls — not local state
  ========================================================= */
  useEffect(() => {
    async function loadStatus() {
      if (!tourId || !auth.data?.user?._id) return;

      try {
        const res = await apiGetUserTourStatus(tourId);
        const serverStatus = res?.usertours?.status;

        dispatch(setActiveTour(tourId));

        if (serverStatus === "start") {
          dispatch(setStatus("running"));
        } else if (serverStatus === "pause") {
          dispatch(setStatus("paused"));
        } else {
          dispatch(setStatus("idle"));
        }
      } catch (err) {
        console.error("Failed to load tour status", err);
        dispatch(setStatus("idle"));
      }
    }

    loadStatus();
  }, [tourId, auth.data, dispatch]);


  /* =========================================================
     ⭐ START TOUR — Fixed logic for empty/null usertour
  ========================================================= */
  const handleStart = async () => {
    if (!tourId) return;

    if (!detail?.tourpoints?.length) {
      toast.error("⚠️ Tourpoints not available");
      return;
    }

    let usertour = null;

    try {
      const res = await apiGetUserTourStatus(tourId);
      usertour = res?.usertours ?? null;

      // ⭐ CASE 1: No status exists → START ALLOWED
      if (
        !usertour ||
        usertour === null ||
        Object.keys(usertour).length === 0
      ) {
        console.log("🟢 No active usertour → starting fresh");
      } else {
        const serverStatus = usertour.status;
        const serverTourId = usertour?.tour?._id;

        // ⭐ CASE 2: Running a DIFFERENT tour → BLOCK
        if (serverStatus === "start" && serverTourId !== tourId) {
          toast.error("⚠️ You already have a running tour. Stop that tour first.");
          return;
        }

        // ⭐ CASE 3: Running SAME tour → INFORM (do not restart)
        if (serverStatus === "start" && serverTourId === tourId) {
          toast.info("✔ This tour is already running.");
          return;
        }
      }
    } catch (err) {
      // ⭐ CASE 4: API Error (404, no record, etc.) → treat as new
      console.log("ℹ️ No usertour found → starting new tour");
    }

    // ⭐ Get user GPS / fallback
    const gps = geofence.last || (await getOneShotLocation());
    if (!gps) {
      toast.error("⚠ Unable to get location. Enable GPS.");
      return;
    }

    // ⭐ Region check
    const inside = isInsideRegion(gps, detail.tourpoints);
    if (!inside) {
      setShowDialog(true);
      return;
    }

    // ⭐ Update Redux UI
    dispatch(setActiveTour(tourId));
    dispatch(setProfile(defaultProfile));
    dispatch(navStart(tourId));

    toast.success("🎯 Tour started");

    // ⭐ Sync backend
    if (auth.data?.user?._id) {
      dispatch(
        syncUserTourStatus({
          userId: auth.data.user._id,
          tourId,
          status: "start",
          location: toSyncLoc(gps),
        })
      );
    }
  };

  /* =========================================================
     ⭐ PAUSE / RESUME
  ========================================================= */
  const handlePauseResume = () => {
    if (!tourId) return;

    const loc = geofence.last || null;

    if (nav.status === "running") {
      dispatch(navPause());
      toast.warning("⏸️ Tour paused");

      if (auth.data?.user?._id) {
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

  /* =========================================================
     ⭐ STOP TOUR
  ========================================================= */
  const handleStop = () => {
    if (!tourId) return;

    dispatch(navStop());
    dispatch(resetGeofence());
    dispatch(setStatus("idle"));

    toast.info("🛑 Tour stopped");

    if (auth.data?.user?._id) {
      dispatch(
        syncUserTourStatus({
          userId: auth.data.user._id,
          tourId,
          status: "end",
          location: toSyncLoc(geofence.last || null),
        })
      );
    }
  };

  const handleBack = () => {
    loader.show();
    requestAnimationFrame(() => router.back());
  };

  const labels = {
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
      {/* Back Button */}
      <div className="fixed left-3 top-3 z-[60]">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full shadow bg-white/80 dark:bg-black/50 backdrop-blur-sm"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Map / List toggle */}
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
            {labels.map}
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
            {labels.list}
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center gap-3">
        {nav.status === "idle" && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg bg-sky-600 text-white"
            onClick={handleStart}
          >
            <Play className="mr-2 h-5 w-5" /> {labels.start}
          </Button>
        )}

        {nav.status === "running" && (
          <>
            <Button
              size="lg"
              variant="outline"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-white/90 dark:bg-black/40"
              onClick={handlePauseResume}
            >
              <Pause className="mr-2 h-5 w-5" /> {labels.pause}
            </Button>

            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-rose-600 text-white"
              onClick={handleStop}
            >
              <StopCircle className="mr-2 h-5 w-5" /> {labels.stop}
            </Button>
          </>
        )}

        {nav.status === "paused" && (
          <>
            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-emerald-600 text-white"
              onClick={handlePauseResume}
            >
              <Play className="mr-2 h-5 w-5" /> {labels.resume}
            </Button>

            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-rose-600 text-white"
              onClick={handleStop}
            >
              <StopCircle className="mr-2 h-5 w-5" /> {labels.stop}
            </Button>
          </>
        )}
      </div>

      {/* Out-of-region Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              You’re not in the region
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Move closer to one of the tour’s points to begin your trip.
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
