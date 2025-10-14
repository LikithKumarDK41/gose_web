"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import MapboxTourMap from "@/components/map/MapboxTourMap";
import NavLink from "@/components/nav/NavLink";
import TimelineRight from "@/components/tour/TimelineRight";
import { Compass } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  fetchTourById,
  fetchTourPoints,
  makeSelectTourPreferringDetail,
  type TourPoint,
  type TravelMode, // ✅ comes directly from touristSlice
} from "@/lib/store/slices/touristSlice";
import { useGlobalLoader } from "@/providers/LoaderProvider";

export default function TourDetailsClientPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  const dispatch = useAppDispatch();
  const { show, hide } = useGlobalLoader();

  const selectById = useMemo(() => makeSelectTourPreferringDetail(), []);
  const tour = useAppSelector((state) => selectById(state, id));

  // redirect if no ID
  useEffect(() => {
    if (!id) router.replace("/tours");
  }, [id, router]);

  // fetch tour detail
  useEffect(() => {
    if (!id) return;
    show();
    const thunk = dispatch(fetchTourById(id));

    thunk
      .unwrap()
      .catch((err: any) => {
        if (err?.name !== "AbortError") console.error("fetchTourById failed", err);
      })
      .finally(() => setTimeout(() => hide(), 400));

    return () => thunk.abort();
  }, [id, locale, dispatch, show, hide]);

  // fetch tourpoints if missing
  useEffect(() => {
    if (id && tour && !tour.tourpoints?.length) {
      dispatch(fetchTourPoints(id)).unwrap().catch(console.error);
    }
  }, [id, tour, dispatch]);

  const onJumpTimeline = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById("timeline");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (!id || !tour?._id)
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        {t("tourDetails.loading")}
      </div>
    );

  return (
    <div className="space-y-8">
      {/* ===== Header ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent dark:from-transparent" />
        <div className="relative mx-auto max-w-4xl p-6 text-center sm:p-7">
          <h1 className="text-2xl font-semibold">{tour.title}</h1>

          {tour.content?.brief && (
            <p className="mt-2 text-sm text-muted-foreground">
              {tour.content.brief.replace(/<[^>]+>/g, "").trim()}
            </p>
          )}

          <section className="flex items-center justify-center gap-4 pt-5 sm:gap-6">
            <div className="flex items-center gap-3 rounded-lg bg-white/70 p-3 ring-1 ring-black/10 backdrop-blur dark:bg-black/40">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Compass className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">{t("tourDetails.stops")}</div>
                <div className="text-sm font-medium">{tour.tourpoints?.length ?? 0}</div>
              </div>
            </div>
          </section>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <NavLink href={`/tours/detail/navigation?id=${encodeURIComponent(id)}`}>
                {t("tourDetails.startNavigation")}
              </NavLink>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#timeline" onClick={onJumpTimeline}>
                {t("tourDetails.jumpToTimeline")}
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Map Section ===== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("tourDetails.map")}</h2>
        {tour.tourpoints?.length ? (
          <React.Suspense
            fallback={<div className="h-[420px] rounded-lg border bg-gray-200 animate-pulse" />}
          >
            <MapboxTourMap tour={tour} profile="walking" />
          </React.Suspense>
        ) : (
          <p className="text-sm text-muted-foreground">{t("tourDetails.noTourPoints")}</p>
        )}
      </section>

      {/* ===== Timeline Section ===== */}
      <section id="timeline" className="space-y-4">
        <h2 className="text-lg font-semibold">{t("tourDetails.timeline")}</h2>
        {tour.tourpoints?.length ? (
          <TimelineRight tourpoints={tour.tourpoints} />
        ) : (
          <div className="text-sm text-muted-foreground">{t("tourDetails.noTourPoints")}</div>
        )}
      </section>
    </div>
  );
}
