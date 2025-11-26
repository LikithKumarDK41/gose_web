// NavigationPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MapboxTourMapNavigation from "@/components/map/MapboxTourMapNavigation";
import NavigationOverlay from "@/components/map/NavigationOverlay";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";

import {
  fetchTourById,
  fetchTourPoints,
  selectTourDetail,
} from "@/lib/store/slices/touristSlice";

import type { TourPoint, Tour } from "@/lib/types/userTour.types";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { X } from "lucide-react";
import MapTimelineRight from "@/components/tour/MapTimelineRight";

import {
  apiGetUserTourStatus,
  apiGetUserTourPoints,
} from "@/services/userNavService";

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

  if (!id || !tour?._id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">{t("loading_map")}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <MapboxTourMapNavigation tour={tour} profile="walking" height="100vh" />

      <NavigationOverlay
        tourId={tour._id}
        defaultProfile="walking"
        listOpen={listOpen}
        onOpenList={() => setListOpen(true)}
        onCloseList={() => setListOpen(false)}
      />

      <TourPointsModal
        open={listOpen}
        onClose={() => setListOpen(false)}
        tour={tour}
      />
    </div>
  );
}

/* ===============================================================
   MODAL - Uses *User Navigation Service* TourPoints (dynamic)
================================================================ */

function TourPointsModal({
  open,
  onClose,
  tour,
}: {
  open: boolean;
  onClose: () => void;
  tour: Tour;
}) {
  const { t } = useLocale();

  const [points, setPoints] = useState<TourPoint[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===================================================
     FETCH USER TOURPOINTS (dynamic)
  =================================================== */
  useEffect(() => {
    if (!open || !tour?._id) return;

    let cancel = false;

    (async () => {
      try {
        setLoading(true);

        /* 🔥 1) Fetch usertourId from /v2/usertourstatus */
        const status = await apiGetUserTourStatus(tour._id);
        const usertourId = status?.usertours?._id ?? null;

        if (!usertourId) {
          console.warn("No usertour started yet!");
        }

        /* 🔥 2) Fetch user tourpoints */
        const res = await apiGetUserTourPoints(tour._id);

        if (!cancel) {
          setPoints(res?.tourpoints || []);
        }
      } catch (err) {
        console.error("Failed to load user tourpoints:", err);
        if (!cancel) setPoints([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [open, tour?._id]);

  /* ----------------------- UI ----------------------- */

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
            <div className="text-sm text-muted-foreground text-center">
              {t("loading_map")}
            </div>
          ) : points.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center">
              {t("no_tour_points_available")}
            </div>
          ) : (
            <MapTimelineRight
              tourpoints={points}
              customStyle="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md hover:shadow-xl transition"
            />
          )}
        </div>
      </div>
    </div>
  );
}
