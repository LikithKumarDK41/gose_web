// NavigationPage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MapboxTourMapNavigation from "@/components/map/MapboxTourMapNavigation";
import NavigationOverlay from "@/components/map/NavigationOverlay";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  fetchTourById,
  fetchTourPoints,
  makeSelectTourPreferringDetail,
} from "@/lib/store/slices/touristSlice";
import {
  type Tour,
} from "@/services/userTourService";
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

  // NEW: list modal open state
  const [listOpen, setListOpen] = useState(false);

  // Stable selector instance
  const selectById = useMemo(() => makeSelectTourPreferringDetail(), []);
  const tour = useAppSelector((state) => selectById(state, id));

  useEffect(() => {
    if (!id) router.replace("/tours");
  }, [id, router]);

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
        <div className="text-sm text-muted-foreground">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* 🗺️ Map stays mounted at all times */}
      <MapboxTourMapNavigation tour={tour} profile="walking" height="100vh" />

      {/* 🔝 Overlay with segmented buttons that open/close the list modal */}
      <NavigationOverlay
        tourId={tour._id}
        defaultProfile="walking"
        listOpen={listOpen}
        onOpenList={() => setListOpen(true)}
        onCloseList={() => setListOpen(false)}
      />

      {/* 🪟 Modal List on top of the map (does not affect map state) */}
      <TourPointsModal
        open={listOpen}
        onClose={() => setListOpen(false)}
        tour={tour}
      />
    </div>
  );
}

/* ===================== Modal ===================== */
function TourPointsModal({
  open,
  onClose,
  tour,
}: {
  open: boolean;
  onClose: () => void;
  tour: Tour;
}) {
  if (!open) return null;

  const points = tour?.tourpoints ?? [];

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      {/* Panel */}
      <div className="relative w-full h-[100vh] bg-background shadow-2xl overflow-hidden flex flex-col border">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
          <div className="font-semibold truncate">{tour.title}</div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable timeline */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {points.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center">
              No tour points available.
            </div>
          ) : (
            <MapTimelineRight tourpoints={points} />
          )}
        </div>
      </div>
    </div>
  );
}
