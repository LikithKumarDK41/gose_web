"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";

import {
  selectNav,
  navStart,
  navPause,
  navResume,
  navStop,
  setProfile,
  setActiveTour,
  setStatus,
  syncUserTourStatus,
  selectUserTourPoints,
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

import type { TourPoint } from "@/lib/types/userTour.types";

/* =========================================================
   🌍 Helpers
========================================================= */
function normalizeLngLat(loc: any): { lat: number; lng: number } | null {
  if (!loc) return null;

  if (Array.isArray(loc)) {
    const [lng, lat] = loc;
    return { lat, lng };
  }

  if (typeof loc === "object") {
    const { lat, lng } = loc;
    return { lat, lng };
  }

  return null;
}

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371e3;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

async function getOneShotLocation() {
  if (!("geolocation" in navigator)) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/* =========================================================
   ⭐ Stamp Logic (Ignore station + lunch)
========================================================= */
function isStampedObject(obj: any) {
  return obj && typeof obj === "object" && Object.keys(obj).length > 0;
}

function allStamped(points: TourPoint[]) {
  if (!points?.length) return false;

  const valid = points.filter(
    (p) => p.pointtype !== "station" && p.pointtype !== "lunch"
  );

  if (!valid.length) return false;

  return valid.every((p) => isStampedObject(p.stamp));
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
  tourPoints = [],
  onRefreshTourPoints,
}: {
  tourId: string;
  defaultProfile?: "walking" | "driving" | "cycling";
  listOpen?: boolean;
  onOpenList?: () => void;
  onCloseList?: () => void;
  tourPoints?: TourPoint[]; // kept as fallback
  onRefreshTourPoints?: () => Promise<void>;
}) {
  const router = useRouter();
  const loader = useGlobalLoader();
  const nav = useAppSelector(selectNav);
  const auth = useAppSelector((s) => s.auth);
  const geofence = useAppSelector((s) => s.geofence);

  const detail = useAppSelector((s) => s.tourist.detail);
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();

  // Prefer Redux-stored tourpoints from nav slice
  const reduxTourPoints = useAppSelector(selectUserTourPoints);

  const [showDialog, setShowDialog] = useState(false);
  const [finished, setFinished] = useState(false);

  const toSyncLoc = (p: any): [string, string] => {
    const loc = p || { lat: 0, lng: 0 };
    return [String(loc.lng), String(loc.lat)];
  };

  const isInsideRegion = (user: any, tps: any[]) => {
    if (!tps?.length) return false;

    for (const p of tps) {
      const pos = normalizeLngLat(p?.monument?.location ?? p?.location);
      if (!pos) continue;

      const radius =
        typeof p?.monument?.georadius === "number" ? p.monument.georadius : 50;

      if (haversineMeters(user, pos) <= radius) return true;
    }

    return false;
  };

  /* =========================================================
       ⭐ Monitor tourPoints changes (use Redux data first)
       Use reduxTourPoints when available; fallback to prop tourPoints
       This makes finish button depend on Redux nav slice data
    ========================================================= */
  useEffect(() => {
    const source =
      Array.isArray(reduxTourPoints) && reduxTourPoints.length
        ? reduxTourPoints
        : tourPoints;

    const isFinished = allStamped(source);
    setFinished(isFinished);
  }, [reduxTourPoints, tourPoints]);

  /* =========================================================
       ⭐ Load tour status on mount
    ========================================================= */
  useEffect(() => {
    (async () => {
      if (!tourId || !auth.data?.user?._id) return;

      try {
        const res = await apiGetUserTourStatus(tourId);
        const serverStatus = res?.usertours?.status;

        dispatch(setActiveTour(tourId));

        if (serverStatus === "start") dispatch(setStatus("running"));
        else if (serverStatus === "pause") dispatch(setStatus("paused"));
        else dispatch(setStatus("idle"));
      } catch (err) {
        console.error("Failed to load navigation data", err);
        dispatch(setStatus("idle"));
      }
    })();
  }, [tourId, auth.data, dispatch]);

  /* =========================================================
       ⭐ Auto-refresh tourpoints every 5 seconds when running
       (still triggers onRefreshTourPoints if provided)
    ========================================================= */
  useEffect(() => {
    if (nav.status !== "running" || !tourId) return;

    const interval = setInterval(async () => {
      if (onRefreshTourPoints) {
        try {
          await onRefreshTourPoints();
        } catch (err) {
          console.warn("Auto-refresh tourpoints failed:", err);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [nav.status, tourId, onRefreshTourPoints]);

  // ...existing code (handleStart, handlePauseResume, handleFinish, UI) ...

  /* =========================================================
       ⭐ START
    ========================================================= */
  const handleStart = async () => {
    if (!tourId) return;

    if (!detail?.tourpoints?.length) {
      toast.error(t("tourpoints_not_available"));
      return;
    }

    let usertour = null;

    try {
      const res = await apiGetUserTourStatus(tourId);
      usertour = res?.usertours ?? null;

      if (
        usertour &&
        usertour.status === "start" &&
        usertour?.tour?._id === tourId
      ) {
        toast.info(t("tour_already_running"));
        return;
      }
    } catch {}

    const gps = geofence.last || (await getOneShotLocation());
    if (!gps) {
      toast.error(t("gps_enable"));
      return;
    }

    if (!isInsideRegion(gps, detail.tourpoints)) {
      setShowDialog(true);
      return;
    }

    dispatch(setActiveTour(tourId));
    dispatch(setProfile(defaultProfile));
    dispatch(navStart(tourId));

    toast.success(t("tour_started"));

    if (auth.data?.user?._id) {
      try {
        await dispatch(
          syncUserTourStatus({
            userId: auth.data.user._id,
            tourId,
            status: "start",
            location: toSyncLoc(gps),
          })
        ).unwrap();
      } catch (err) {
        console.error("Failed to sync tour status:", err);
        toast.error("failed_sync_status");
      }
    }

    if (onRefreshTourPoints) {
      await onRefreshTourPoints();
    }
  };

  /* =========================================================
       ⭐ PAUSE / RESUME
    ========================================================= */
  const handlePauseResume = async () => {
    if (!tourId) return;

    const loc = geofence.last || null;

    if (nav.status === "running") {
      dispatch(navPause());
      toast.warning(t("tour_paused"));

      try {
        await dispatch(
          syncUserTourStatus({
            userId: auth.data?.user?._id || "",
            tourId,
            status: "pause",
            location: toSyncLoc(loc),
          })
        ).unwrap();
      } catch (err) {
        console.error("Failed to sync pause status:", err);
      }
    } else if (nav.status === "paused") {
      dispatch(navResume());
      toast.success(t("tour_resumed"));

      try {
        await dispatch(
          syncUserTourStatus({
            userId: auth.data?.user?._id || "",
            tourId,
            status: "start",
            location: toSyncLoc(loc),
          })
        ).unwrap();
      } catch (err) {
        console.error("Failed to sync resume status:", err);
      }
    }
  };

  /* =========================================================
       ⭐ FINISH (only when all stamps collected)
       Uses Redux tourpoints to decide availability
    ========================================================= */
  const handleFinish = async () => {
    if (!tourId) return;

    try {
      await dispatch(
        syncUserTourStatus({
          userId: auth.data?.user?._id || "",
          tourId,
          status: "end",
          location: toSyncLoc(geofence.last || null),
        })
      ).unwrap();
    } catch (err) {
      console.error("Failed to sync finish status:", err);
    }

    router.replace(`/tours/detail/navigation/finish?tourId=${tourId}`);

    dispatch(setStatus("idle"));
    toast.success("tour_finished");
  };

  const handleBack = () => {
    loader.show();
    requestAnimationFrame(() => router.back());
  };

  const labels = {
    start: t("Start"),
    pause: t("Pause"),
    resume: t("Resume"),
    finish: t("Finish"),
    map: t("Map"),
    list: t("List"),
    back: t("Back"),
  };

  return (
    <>
      {/* Back */}
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

      {/* Map/List */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center rounded-full border bg-white/80 dark:bg-black/50 backdrop-blur px-1 py-1 shadow">
          <button
            type="button"
            onClick={onCloseList}
            className={`px-3 py-1.5 rounded-full text-sm ${
              !listOpen ? "bg-sky-600 text-white" : "hover:bg-white/70"
            }`}
          >
            {labels.map}
          </button>

          <button
            type="button"
            onClick={onOpenList}
            className={`px-3 py-1.5 rounded-full text-sm ${
              listOpen ? "bg-sky-600 text-white" : "hover:bg-white/70"
            }`}
          >
            {labels.list}
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center gap-3">
        {/* START - Idle state */}
        {nav.status === "idle" && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg bg-sky-600 text-white hover:bg-sky-700"
            onClick={handleStart}
          >
            <Play className="mr-2 h-5 w-5" /> {labels.start}
          </Button>
        )}

        {/* PAUSE - Running state (stamps not complete) */}
        {nav.status === "running" && !finished && (
          <Button
            size="lg"
            variant="outline"
            className="pointer-events-auto rounded-full px-6 shadow-lg bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/50"
            onClick={handlePauseResume}
          >
            <Pause className="mr-2 h-5 w-5" /> {labels.pause}
          </Button>
        )}

        {/* RESUME - Paused state */}
        {nav.status === "paused" && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handlePauseResume}
          >
            <Play className="mr-2 h-5 w-5" /> {labels.resume}
          </Button>
        )}

        {/* FINISH - All stamps collected & running */}
        {finished && nav.status === "running" && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg bg-green-600 text-white hover:bg-green-700"
            onClick={handleFinish}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" /> {labels.finish}
          </Button>
        )}
      </div>

      {/* Out of Region Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t("out_of_region")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {t("move_closer_to_start_trip")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="rounded-full"
            >
              {t("ok_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
