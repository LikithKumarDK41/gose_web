"use client";

import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import MapboxTourMap from "@/components/map/MapboxTourMap";
import NavLink from "@/components/nav/NavLink";
import TimelineRight from "@/components/tour/TimelineRight";
import { Compass, Bookmark, BookmarkCheck } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  fetchTourById,
  fetchTourPoints,
  makeSelectTourPreferringDetail,
} from "@/lib/store/slices/touristSlice";
import { useGlobalLoader } from "@/providers/LoaderProvider";

export default function TourDetailsClientPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  const dispatch = useAppDispatch();
  const { show, hide } = useGlobalLoader();
  const [bookmarked, setBookmarked] = useState(false);

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
        if (err?.name !== "AbortError")
          console.error("fetchTourById failed", err);
      })
      .finally(() => setTimeout(() => hide(), 400));
    return () => thunk.abort();
  }, [id, locale, dispatch, hide]);

  // fetch points
  useEffect(() => {
    if (id && tour && !tour.tourpoints?.length) {
      dispatch(fetchTourPoints(id)).unwrap().catch(console.error);
    }
  }, [id, tour, dispatch]);

  const onJumpTimeline = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const el = document.getElementById("timeline");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    []
  );

  const toggleBookmark = () => setBookmarked((p) => !p);

  /* -------------------- shimmer (fallback) -------------------- */
  if (!id || !tour) {
    return (
      <div className="space-y-12">
        {/* Banner shimmer */}
        <div className="relative h-[420px] sm:h-[480px] w-full overflow-hidden rounded-2xl shadow-md">
          <div className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 absolute inset-0" />
        </div>

        {/* Floating card shimmer */}
        <div className="relative z-10 flex justify-center -mt-24">
          <div className="w-[90%] sm:w-[80%] max-w-4xl h-[320px] rounded-3xl overflow-hidden animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-[0_8px_40px_-10px_rgba(0,0,0,0.4)]" />
        </div>

        {/* Map shimmer */}
        <div className="space-y-4">
          <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-[420px] rounded-lg border animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
        </div>
      </div>
    );
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="space-y-12">
      {/* ===== Banner ===== */}
      <section className="relative rounded-2xl overflow-hidden shadow-md">
        {/* Banner Image */}
        <div className="relative h-[420px] sm:h-[480px] w-full">
          {tour.image?.secure_url ? (
            <img
              src={tour.image.secure_url}
              alt={tour.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-gray-800 dark:to-gray-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        {/* Bookmark */}
        <button
          onClick={toggleBookmark}
          aria-label="Bookmark tour"
          className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/30 hover:bg-white/50 dark:bg-gray-900/40 dark:hover:bg-gray-800 transition backdrop-blur-md shadow"
        >
          {bookmarked ? (
            <BookmarkCheck className="h-6 w-6 text-yellow-400" />
          ) : (
            <Bookmark className="h-6 w-6 text-white dark:text-gray-200" />
          )}
        </button>

        {/* Title + Subtitle (Centered Vertically) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
          <h1 className="text-4xl sm:text-5xl font-bold drop-shadow-lg">
            {tour.title}
          </h1>
          {tour.content?.brief && (
            <p className="mt-4 text-sm sm:text-base text-gray-200 max-w-2xl mx-auto leading-relaxed">
              {tour.content.brief.replace(/<[^>]+>/g, "").trim()}
            </p>
          )}
        </div>
      </section>

      {/* ===== Double-Curved Floating Info Card ===== */}
      <section className="relative z-10 flex justify-center">
        <div
          className="relative -mt-24 w-[90%] sm:w-[80%] max-w-4xl overflow-hidden rounded-3xl 
          bg-gradient-to-b from-gray-50/70 via-white/60 to-gray-100/70 
          dark:from-gray-900/70 dark:via-gray-800/80 dark:to-gray-900/80
          backdrop-blur-xl border border-white/10 shadow-[0_8px_40px_-10px_rgba(0,0,0,0.4)]
          transition-all duration-500 hover:shadow-[0_0_45px_-5px_rgba(99,102,241,0.4)]"
        >
          {/* Top Curved Divider */}
          <svg
            className="absolute top-0 left-0 w-full text-indigo-500/10 dark:text-indigo-400/10"
            viewBox="0 0 500 50"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C150,60 350,-20 500,40 L500,0 L0,0 Z"
              fill="currentColor"
            />
          </svg>

          {/* Bottom Curved Divider (mirrored) */}
          <svg
            className="absolute bottom-0 left-0 w-full rotate-180 text-indigo-500/10 dark:text-indigo-400/10"
            viewBox="0 0 500 50"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C150,60 350,-20 500,40 L500,0 L0,0 Z"
              fill="currentColor"
            />
          </svg>

          {/* Inner Content */}
          <div className="relative px-8 sm:px-12 py-12 sm:py-14 text-center">
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-10 mb-8">
              {/* Stops */}
              <div className="flex flex-col items-center">
                <div
                  className="h-14 w-14 flex items-center justify-center rounded-full
                  bg-gradient-to-tr from-indigo-500/20 to-indigo-700/20 
                  border border-indigo-500/30 shadow-inner"
                >
                  <Compass className="h-6 w-6 text-indigo-500 dark:text-indigo-300" />
                </div>
                <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {t("tourDetails.stops")}
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tour.tourpoints?.length ?? 0}
                </span>
              </div>

              {/* Duration */}
              {tour.duration && (
                <div className="flex flex-col items-center">
                  <div
                    className="h-14 w-14 flex items-center justify-center rounded-full
                    bg-gradient-to-tr from-emerald-500/20 to-emerald-700/20
                    border border-emerald-500/30 shadow-inner"
                  >
                    <span className="text-base font-semibold text-emerald-600 dark:text-emerald-300">
                      {tour.duration}
                    </span>
                  </div>
                  <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {t("tourDetails.duration")}
                  </span>
                </div>
              )}

              {/* Travel Time */}
              {tour.traveltime && (
                <div className="flex flex-col items-center">
                  <div
                    className="h-14 w-14 flex items-center justify-center rounded-full
                    bg-gradient-to-tr from-sky-500/20 to-sky-700/20
                    border border-sky-500/30 shadow-inner"
                  >
                    <span className="text-base font-semibold text-sky-600 dark:text-sky-300">
                      {tour.traveltime}
                    </span>
                  </div>
                  <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {t("tourDetails.travelTime")}
                  </span>
                </div>
              )}
            </div>

            {/* ===== CTA Buttons ===== */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700
                text-white font-semibold shadow-md hover:shadow-xl transition-all hover:scale-[1.04]"
                asChild
              >
                <NavLink
                  href={`/tours/detail/navigation?id=${encodeURIComponent(id)}`}
                >
                  {t("tourDetails.startNavigation")}
                </NavLink>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 dark:border-gray-600 
                text-gray-800 dark:text-gray-200 hover:bg-gray-100/30 dark:hover:bg-gray-800/50 
                font-semibold transition-all hover:scale-[1.04]"
                asChild
              >
                <a href="#timeline" onClick={onJumpTimeline}>
                  {t("tourDetails.jumpToTimeline")}
                </a>
              </Button>
            </div>

            {/* ===== Featured & Special Chips ===== */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {tour.featured && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                  bg-gradient-to-r from-indigo-600 to-violet-600
                  text-white text-[11px] sm:text-xs font-semibold
                  shadow-[0_0_8px_rgba(99,102,241,0.25)] border border-white/10
                  hover:shadow-[0_0_14px_rgba(139,92,246,0.35)] transition-all duration-300"
                >
                  <span className="text-sm leading-none">⭐</span>
                  <span className="capitalize">{t("actions.featured")}</span>
                </div>
              )}

              {tour.special && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                  bg-gradient-to-r from-pink-500 to-rose-600
                  text-white text-[11px] sm:text-xs font-semibold
                  shadow-[0_0_8px_rgba(236,72,153,0.25)] border border-white/10
                  hover:shadow-[0_0_14px_rgba(244,114,182,0.35)] transition-all duration-300"
                >
                  <span className="text-sm leading-none">💎</span>
                  <span className="capitalize">{t("tourDetails.special")}</span>
                </div>
              )}
            </div>

            {/* ===== Special Content ===== */}
            {tour.special && tour.specialContent && (
              <div
                className="mt-3 text-center mx-auto max-w-2xl px-4 
                text-sm sm:text-base text-gray-700 dark:text-gray-300
                leading-relaxed prose prose-sm dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: tour.specialContent }}
              />
            )}
          </div>
        </div>
      </section>

      {/* ===== Map Section ===== */}
      {tour.tourpoints?.length ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("tourDetails.map")}</h2>
          <Suspense
            fallback={
              <div className="h-[420px] rounded-lg border animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
            }
          >
            <MapboxTourMap tour={tour} profile="walking" />
          </Suspense>
        </section>
      ) : (
        // Shimmer fallback if map still loading
        <div className="space-y-4">
          <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-[420px] rounded-lg border animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
        </div>
      )}

      {/* ===== Timeline Section ===== */}
      {tour.tourpoints?.length && (
        <section id="timeline" className="space-y-4">
          <h2 className="text-lg font-semibold">{t("tourDetails.timeline")}</h2>
          <TimelineRight tourpoints={tour.tourpoints} />
        </section>
      )}
    </div>
  );
}
