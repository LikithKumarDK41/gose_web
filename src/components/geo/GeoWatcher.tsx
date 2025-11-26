"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  selectNav,
  pauseTour as navPause,
  resumeTour as navResume,
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

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);

  /* ------------------ Helpers ------------------ */
  const getTourPlaces = () => {
    if (!tour?.tourpoints?.length) return [];

    // Ensure only valid numeric lat/lng values are included
    return tour.tourpoints
      .filter((tp) => !!tp.monument?.location)
      .map((tp) => {
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

        // Only return valid coordinates
        if (lat === undefined || lng === undefined) return null;

        return {
          /** REQUIRED BY geofenceSlice */
          id: tp._id,
          tourpointId: tp._id, // ⭐ FIX HERE
          monumentId: tp.monument?._id ?? null,

          /** EXTRAS */
          name: tp.monument?.title || tp.name || "Unknown",
          lat,
          lng,
          radius: tp.monument?.georadius ?? DEFAULT_RADIUS,
          blurb: tp.monument?.content?.brief ?? "",
          tourId: tour?._id ?? null,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  };

  /* ------------------ Start Watching ------------------ */
  const startWatching = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser.");
      return;
    }

    const places = getTourPlaces();

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
  };

  /* ------------------ Stop Watching ------------------ */
  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  };

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
  }, [nav.status, dispatch]);

  /* ✅ Lifecycle for tour running state */
  useEffect(() => {
    if (nav.status !== "running" || !tour?.tourpoints?.length) {
      stopWatching();
      return;
    }

    startWatching();
    return stopWatching;
  }, [nav.status, tour]);

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
  }, [nav.status, tour]);

  return null;
}
