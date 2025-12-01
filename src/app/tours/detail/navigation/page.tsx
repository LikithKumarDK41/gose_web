"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "@/lib/store/slices/navSlice";

import type { Tour } from "@/lib/types/userTour.types";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { X } from "lucide-react";
import MapTimelineRight from "@/components/tour/MapTimelineRight";

export default function NavigationPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  const { locale, t } = useLocale();
  const dispatch = useAppDispatch();
  const { show, hide } = useGlobalLoader();

  const [listOpen, setListOpen] = useState(false);

  const tour = useAppSelector(selectTourDetail);
  const nav = useAppSelector(selectNav);
  const cachedTourPoints = useAppSelector(selectUserTourPoints);

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
     REFRESH TOURPOINTS (parent) — only place we call API
  =================================================== */
  const refreshUserTourPoints = useCallback(async () => {
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
      />

      <NavigationOverlay
        tourId={tour._id}
        defaultProfile="walking"
        listOpen={listOpen}
        onOpenList={() => setListOpen(true)}
        onCloseList={() => setListOpen(false)}
        tourPoints={cachedTourPoints}
        onRefreshTourPoints={refreshUserTourPoints}
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
   MODAL - Calls ONLY parent onRefreshTourPoints
   Whenever modal is open, parent refresh is invoked.
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
  const cachedTourPoints = useAppSelector(selectUserTourPoints);

  const [loading, setLoading] = useState(true);

  // 🔁 Whenever the modal is OPEN, use ONLY parent refresh function
  useEffect(() => {
    if (!open) return;

    // if critical IDs are missing, just stop loading to avoid spinner forever
    if (!tour?._id || !usertourId || !tourId) {
      setLoading(false);
      return;
    }

    if (!onRefreshTourPoints) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        await onRefreshTourPoints();
      } catch (err) {
        console.error("Failed to load user tourpoints (modal via parent):", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, tour?._id, usertourId, tourId, onRefreshTourPoints]);

  // child-initiated refresh (from MapTimelineRight) → still just calls parent
  const handleChildRefresh = useCallback(async () => {
    if (!onRefreshTourPoints) return;
    try {
      setLoading(true);
      await onRefreshTourPoints();
    } catch (err) {
      console.error("Child triggered refresh failed (via parent):", err);
    } finally {
      setLoading(false);
    }
  }, [onRefreshTourPoints]);

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
            <div className="flex items-center justify-center h-full">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
            </div>
          ) : cachedTourPoints.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground text-center">
                {t("no_tour_points_available")}
              </p>
            </div>
          ) : (
            <MapTimelineRight
              tourpoints={cachedTourPoints}
              customStyle="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md hover:shadow-xl transition"
              onRefreshTourpoints={handleChildRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}
