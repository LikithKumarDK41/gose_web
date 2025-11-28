"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  selectNav,
  navPause,
  navResume,
  selectUserTourPoints, // ✅ for stamp info
} from "@/lib/store/slices/navSlice";
import { locationTick } from "@/lib/store/slices/geofenceSlice";
import { selectTourDetail } from "@/lib/store/slices/touristSlice";
import { toast } from "sonner";

const DEFAULT_RADIUS = 5000;
const UPDATE_INTERVAL = 1500;
const GEO_TIMEOUT = 30000;
const RETRY_DELAY = 5000;

export default function GeoWatcher() {
  const dispatch = useAppDispatch();
  const nav = useAppSelector(selectNav);
  const tour = useAppSelector(selectTourDetail);

  // ⭐ Contains stamp status for each user tourpoint
  const usertourPoints = useAppSelector(selectUserTourPoints);

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);

  /* ------------------ Helpers ------------------ */

  // ✅ Return true if stamp is a non-empty object
  const hasStamp = (stamp: unknown): boolean => {
    return (
      !!stamp &&
      typeof stamp === "object" &&
      Object.keys(stamp as Record<string, unknown>).length > 0
    );
  };

  /**
   * Try to match a tourpoint from `tour.tourpoints` with an entry in `usertourPoints`.
   * Different APIs sometimes use:
   * - utp.tourpointId
   * - utp.tourpoint
   * - utp.tourpoint._id
   * - utp._id
   */
  const findMetaForTourpoint = useCallback(
    (tpId: string) => {
      if (!usertourPoints || !usertourPoints.length) return null;

      return (
        usertourPoints.find((u: any) => {
          const candidateIds = [
            u.tourpointId,
            u.tourpoint?._id,
            u.tourpoint,
            u._id,
          ]
            .filter(Boolean)
            .map(String);

          return candidateIds.includes(String(tpId));
        }) || null
      );
    },
    [usertourPoints]
  );

  /**
   * Build the list of geofence places from the tour + usertourPoints.
   * - Exclude points that already have a stamp (in usertourPoints or tp.stamp)
   */
  const getTourPlaces = useCallback(() => {
    if (!tour?.tourpoints?.length) return [];

    return (
      tour.tourpoints
        // 1️⃣ Filter out points that are already stamped
        .filter((tp: any) => {
          const tpId = String(tp._id);
          const meta = findMetaForTourpoint(tpId) || {};

          // Prefer stamp from usertourPoints (meta.stamp)
          // fallback to tp.stamp if present
          const stampSource =
            meta && "stamp" in meta ? meta.stamp : (tp as any).stamp;

          const stamped = hasStamp(stampSource);

          // 👉 If already stamped → NO popup
          if (stamped) {
            // Debug (optional): console.log("Skipping stamped point", tpId, tp.name);
            return false;
          }

          // 👉 If not stamped (stamp empty / undefined) → allow
          return true;
        })
        // 2️⃣ Ensure we have valid coordinates
        .filter((tp: any) => !!tp.monument?.location)
        // 3️⃣ Map into geofenceSlice's expected shape
        .map((tp: any) => {
          const loc = tp.monument?.location;
          let lat: number | undefined;
          let lng: number | undefined;

          if (Array.isArray(loc) && loc.length >= 2) {
            lng = typeof loc[0] === "number" ? loc[0] : undefined;
            lat = typeof loc[1] === "number" ? loc[1] : undefined;
          } else if (typeof loc === "object" && loc !== null) {
            lat =
              typeof (loc as any).lat === "number"
                ? (loc as any).lat
                : undefined;
            lng =
              typeof (loc as any).lng === "number"
                ? (loc as any).lng
                : undefined;
          }

          if (lat === undefined || lng === undefined) return null;

          return {
            id: tp._id,
            tourpointId: tp._id,
            monumentId: tp.monument?._id ?? null,
            name: tp.monument?.title || tp.name || "Unknown",
            lat,
            lng,
            radius: tp.monument?.georadius ?? DEFAULT_RADIUS,
            blurb: tp.monument?.content?.brief ?? "",
            tourId: tour?._id ?? null,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)
    );
  }, [tour, findMetaForTourpoint]);

  /* ------------------ Start / Stop Watching ------------------ */

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser.");
      return;
    }

    const places = getTourPlaces();
    // Debug: console.log("Geofence places:", places);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < UPDATE_INTERVAL) return;
        lastSentRef.current = now;

        const { latitude, longitude } = pos.coords;
        localStorage.setItem(
          "last_known_location",
          JSON.stringify({ lat: latitude, lng: longitude })
        );

        dispatch(
          locationTick({
            lat: latitude,
            lng: longitude,
            places,
            tourId: tour?._id ?? null,
          })
        );
      },
      (err) => {
        console.error("❌ Geolocation error:", err);
        if (err.code === err.TIMEOUT) {
          toast.warning("⏳ Location timeout, retrying...");
          retryTimer.current = setTimeout(startWatching, RETRY_DELAY);
        }
      },
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT, maximumAge: 10000 }
    );
  }, [dispatch, getTourPlaces, tour?._id, stopWatching]);

  /* ✅ Pause/resume on visibility change */

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && nav.status === "running") {
        console.log("🟠 App hidden → auto-pausing tour");
        dispatch(navPause());
        stopWatching();
      } else if (
        document.visibilityState === "visible" &&
        nav.status === "paused"
      ) {
        console.log("🟢 App visible → resuming tour tracking");
        dispatch(navResume());
        startWatching();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [nav.status, dispatch, startWatching, stopWatching]);

  /* ✅ Lifecycle for tour running state
        ⬅️ Also reacts to usertourPoints changes via startWatching deps
  */

  useEffect(() => {
    if (nav.status !== "running" || !tour?.tourpoints?.length) {
      stopWatching();
      return;
    }

    // Whenever:
    // - nav.status changes, or
    // - tour changes, or
    // - usertourPoints changes (through getTourPlaces → startWatching)
    // we restart the watcher with fresh places
    startWatching();
    return stopWatching;
  }, [nav.status, tour?._id, startWatching, stopWatching]);

  /* ✅ Restore last known position on load */

  useEffect(() => {
    if (nav.status !== "running") return;

    const saved = localStorage.getItem("last_known_location");
    if (!saved) return;

    try {
      const { lat, lng } = JSON.parse(saved);
      if (typeof lat === "number" && typeof lng === "number") {
        const places = getTourPlaces();
        dispatch(
          locationTick({
            lat,
            lng,
            places,
            tourId: tour?._id ?? null,
          })
        );
      }
    } catch (e) {
      console.warn("Invalid saved location in localStorage:", e);
    }
  }, [nav.status, getTourPlaces, dispatch, tour?._id]);

  return null;
}
