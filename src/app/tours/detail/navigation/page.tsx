"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MapboxTourMapNavigation from "@/components/map/MapboxTourMapNavigation";
import NavigationOverlay from "@/components/map/NavigationOverlay";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  fetchTourById,
  fetchTourPoints,
  makeSelectTourPreferringDetail,
} from "@/lib/store/slices/touristSlice";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { useLocale } from "@/providers/LocaleProvider";

/* -------------------- Component -------------------- */
export default function NavigationPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  const { locale } = useLocale();
  const dispatch = useAppDispatch();
  const { show, hide } = useGlobalLoader();

  // ✅ Stable selector instance
  const selectById = useMemo(() => makeSelectTourPreferringDetail(), []);
  const tour = useAppSelector((state) => selectById(state, id));

  /* -------------------- Redirect if no ID -------------------- */
  useEffect(() => {
    if (!id) router.replace("/tours");
  }, [id, router]);

  /* -------------------- Fetch Tour -------------------- */
  useEffect(() => {
    if (!id) return;

    show(); // global loader

    const thunk = dispatch(fetchTourById(id));
    thunk
      .unwrap()
      .catch((err: any) => {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        console.error("fetchTourById failed", err);
      })
      .finally(() => setTimeout(() => hide(), 400));

    return () => thunk.abort();
  }, [id, locale, dispatch, show, hide]);

  /* -------------------- Fetch Tour Points -------------------- */
  useEffect(() => {
    if (!id || !tour) return;

    if (!tour.tourpoints?.length) {
      dispatch(fetchTourPoints(id))
        .unwrap()
        .catch((err) => console.error("fetchTourPoints failed:", err));
    }
  }, [id, tour, dispatch]);

  /* -------------------- Render -------------------- */
  if (!id || !tour?._id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading map…</div>
      </div>
    );
  }

  /* -------------------- Main -------------------- */
  return (
    <div className="fixed inset-0 z-50">
      <MapboxTourMapNavigation tour={tour} profile="walking" height="100vh" />
      <NavigationOverlay
        tourId={tour._id}
        defaultProfile="walking"
      />
    </div>
  );
}
