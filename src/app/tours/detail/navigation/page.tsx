"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MapboxTourMapNavigation from "@/components/map/MapboxTourMapNavigation";
import NavigationOverlay from "@/components/map/NavigationOverlay";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";

import {
  fetchTourById,
  fetchTourPoints,
  selectTourDetail,
} from "@/lib/store/slices/touristSlice";

import {
  selectNav,
  fetchUserTourPoints,
  selectUserTourPoints,
  selectUserTourPointsFor,
} from "@/lib/store/slices/navSlice";

import type { TourPoint, Tour } from "@/lib/types/userTour.types";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { X } from "lucide-react";
import MapTimelineRight from "@/components/tour/MapTimelineRight";

export default function NavigationPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  const { locale } = useLocale();
  const dispatch = useAppDispatch();
  const { show, hide } = useGlobalLoader();
  const { t } = useLocale();

  const [listOpen, setListOpen] = useState(false);

  const tour = useAppSelector(selectTourDetail);
  const nav = useAppSelector(selectNav);
  const cachedTourPoints = useAppSelector(selectUserTourPoints);
  const cachedFor = useAppSelector(selectUserTourPointsFor);

  useEffect(() => {
    if (!id) router.replace("/tours");
  }, [id, router]);

  /* ===================================================
     LOAD TOUR DETAILS
  =================================================== */
  useEffect(() => {
    if (!id) return;

    show();
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

  /* ===================================================
     LOAD STATIC TOUR POINTS (fallback only)
  =================================================== */
  useEffect(() => {
    if (!id || !tour) return;

    if (!tour.tourpoints?.length) {
      dispatch(fetchTourPoints(id))
        .unwrap()
        .catch((err) => console.error("fetchTourPoints failed:", err));
    }
  }, [id, tour, dispatch]);

  /* ===================================================
     REFRESH TOURPOINTS (parent) — uses Redux thunk
     Components read from Redux selectors so they update automatically
  =================================================== */
  const refreshUserTourPoints = useCallback(async () => {
    console.log("hi");
    
    if (!id || !nav.usertour?._id) {
      console.warn("⚠️ No usertour started yet");
      return;
    }

    try {
      const usertourId = nav.usertour._id;
      await dispatch(fetchUserTourPoints({ tourId: id, usertourId })).unwrap();
    } catch (err) {
      console.error("Failed to refresh user tourpoints:", err);
    }
  }, [id, nav.usertour?._id, dispatch]);

  if (!id || !tour?._id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">{t("loading_map")}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <MapboxTourMapNavigation
        tour={tour}
        profile="walking"
        height="100vh"
        usertourId={nav.usertour?._id}
      />

      <NavigationOverlay
        tourId={tour._id}
        defaultProfile="walking"
        listOpen={listOpen}
        onOpenList={() => setListOpen(true)}
        onCloseList={() => setListOpen(false)}
        tourPoints={cachedTourPoints}
      />

      <TourPointsModal
        open={listOpen}
        onClose={() => setListOpen(false)}
        tour={tour}
        onRefreshTourPoints={refreshUserTourPoints}
        usertourId={nav.usertour?._id}
        tourId={id}
      />
    </div>
  );
}

/* ===============================================================
   MODAL - Uses Redux fetchUserTourPoints thunk and selectors
   Initial load runs once on open; child-triggered refresh calls thunk.
================================================================ */

function TourPointsModal({
  open,
  onClose,
  tour,
  onRefreshTourPoints,
  usertourId,
  tourId,
}: {
  open: boolean;
  onClose: () => void;
  tour: Tour;
  onRefreshTourPoints?: () => Promise<void>;
  usertourId?: string | null;
  tourId?: string;
}) {
  const { t } = useLocale();
  const dispatch = useAppDispatch();

  const cachedTourPoints = useAppSelector(selectUserTourPoints);
  const cachedFor = useAppSelector(selectUserTourPointsFor);

  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // initial load when modal opens (only once per open)
  useEffect(() => {
    if (!open || !tour?._id || initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        setLoading(true);
        if (!usertourId || !tourId) return;

        if (cachedFor !== usertourId) {
          await dispatch(fetchUserTourPoints({ tourId, usertourId })).unwrap();
        }
      } catch (err) {
        console.error("Failed to load user tourpoints (modal):", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, tour?._id, usertourId, tourId, cachedFor, dispatch]);

  // child-initiated refresh (passed to MapTimelineRight)
  const handleChildRefresh = useCallback(async () => {
    if (!usertourId || !tourId) return;
    try {
      setLoading(true);
      await dispatch(fetchUserTourPoints({ tourId, usertourId })).unwrap();
      if (onRefreshTourPoints) await onRefreshTourPoints();
    } catch (err) {
      console.error("Child triggered refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }, [usertourId, tourId, dispatch, onRefreshTourPoints]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="relative w-full h-[100vh] bg-background shadow-2xl overflow-hidden flex flex-col border">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
          <div className="font-semibold truncate">{tour.title}</div>

          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted"
            aria-label={t("close")}
            title={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
            </div>
          ) : cachedTourPoints.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center">
              {t("no_tour_points_available")}
            </div>
          ) : (
            <MapTimelineRight
              tourpoints={cachedTourPoints}
              customStyle="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md hover:shadow-xl transition"
              onRefreshTourpoints={handleChildRefresh}
              tourId={tourId}
            />
          )}
        </div>
      </div>
    </div>
  );
}