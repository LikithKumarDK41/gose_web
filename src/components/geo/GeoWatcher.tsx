"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { selectNav, pauseTour as navPause, resumeTour as navResume } from "@/lib/store/slices/navSlice";
import { locationTick } from "@/lib/store/slices/geofenceSlice";
import { makeSelectTourPreferringDetail } from "@/lib/store/slices/touristSlice";
import { toast } from "sonner";

const DEFAULT_RADIUS = 5000;
const UPDATE_INTERVAL = 1500;
const GEO_TIMEOUT = 30000;
const RETRY_DELAY = 5000;

export default function GeoWatcher() {
  const dispatch = useAppDispatch();
  const nav = useAppSelector(selectNav);
  const selectById = useMemo(() => makeSelectTourPreferringDetail(), []);
  const tour = useAppSelector((s) =>
    nav.activeTourId ? selectById(s, nav.activeTourId) : null
  );

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);

  const startWatching = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser.");
      return;
    }

    const places =
      tour?.tourpoints
        ?.filter((tp) => tp.monument?.location)
        .map((tp) => {
          const loc = tp.monument!.location!;
          const lat = Array.isArray(loc) ? loc[1] : loc.lat!;
          const lng = Array.isArray(loc) ? loc[0] : loc.lng!;
          return {
            id: tp._id,
            name: tp.monument?.title ?? tp.name ?? "Unknown",
            lat,
            lng,
            radius: tp.monument?.georadius ?? DEFAULT_RADIUS,
            blurb: tp.monument?.content?.brief ?? "",
            tourId: tour?._id ?? null,
          };
        }) ?? [];

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < UPDATE_INTERVAL) return;
        lastSentRef.current = now;

        const { latitude, longitude } = pos.coords;
        localStorage.setItem("last_known_location", JSON.stringify({ lat: latitude, lng: longitude }));

        dispatch(locationTick({ lat: latitude, lng: longitude, places, tourId: tour?._id ?? null }));
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

  const stopWatching = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  };

  /* ✅ Visibility handling: Pause when hidden, resume when visible */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && nav.status === "running") {
        console.log("🟠 App hidden → auto-pausing tour");
        dispatch(navPause());
        stopWatching();
      } else if (document.visibilityState === "visible" && nav.status === "paused") {
        console.log("🟢 App visible → resuming tour tracking");
        dispatch(navResume());
        startWatching();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [nav.status, dispatch]);

  /* ✅ Watcher lifecycle */
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
    const saved = localStorage.getItem("last_known_location");
    if (saved && nav.status === "running") {
      const { lat, lng } = JSON.parse(saved);
      const places =
        tour?.tourpoints?.map((tp) => ({
          id: tp._id,
          name: tp.monument?.title ?? tp.name ?? "Unknown",
          lat: Array.isArray(tp.monument?.location)
            ? tp.monument!.location![1]
            : tp.monument?.location?.lat!,
          lng: Array.isArray(tp.monument?.location)
            ? tp.monument!.location![0]
            : tp.monument?.location?.lng!,
          radius: tp.monument?.georadius ?? DEFAULT_RADIUS,
          blurb: tp.monument?.content?.brief ?? "",
          tourId: tour?._id ?? null,
        })) ?? [];
      dispatch(locationTick({ lat, lng, places, tourId: tour?._id ?? null }));
    }
  }, [nav.status, tour]);

  return null;
}
