"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import MapboxTourMap from "@/components/map/MapboxTourMap";
import NavLink from "@/components/nav/NavLink";
import TimelineRight, { TravelMode } from "@/components/tour/TimelineRight";
import { Compass, Footprints, Tags } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  fetchTourById,
  makeSelectTourPreferringDetail,
  fetchTourPoints,
} from "@/lib/store/slices/touristSlice";
import { useGlobalLoader } from "@/providers/LoaderProvider";

export default function TourDetailsClientPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  const userId = useAppSelector((s) => (s as any)?.auth_user?.user?._id); // TODO: replace with your real selector
  const dispatch = useAppDispatch();
  const { show, hide } = useGlobalLoader();
  // Keep a single selector instance for this component's lifetime.
  const selectById = useMemo(() => makeSelectTourPreferringDetail(), []);
  const tour = useAppSelector((state) => selectById(state, id));

  // If no id, route back to the list.
  useEffect(() => {
    if (!id) router.replace("/tours");
  }, [id, router]);

  useEffect(() => {
    if (!id) return;

    show(); // Show loader globally (from LoaderProvider)

    // Fetch tour data only if not already loaded
    const thunk = dispatch(fetchTourById(id));

    thunk
      .unwrap()
      .catch((err: any) => {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        console.error("fetchTourById failed", err);
      })
      .finally(() => {
        setTimeout(() => hide(), 500); // wait 500ms before hiding loader
      });

    return () => thunk.abort();
  }, [id, locale, dispatch, show, hide]); // Adding `locale` ensures the effect is triggered when locale changes

  useEffect(() => {
    if (!id) return;

    // Only fetch points if not already loaded
    if (tour && !tour.tourpoints?.length) {
      dispatch(fetchTourPoints(id))
        .unwrap()
        .catch((err) => {
          console.error("fetchTourPoints failed:", err);
        });
    }
  }, [id, tour, dispatch]);

  // Smooth scroll to timeline without soft navigation.
  const onJumpTimeline = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const el = document.getElementById("timeline");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#timeline");
      }
    },
    []
  );

  // Loading / missing states
  if (!id || !tour?._id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">
          {t("tourDetails.loading")}
        </div>
      </div>
    );
  }

  // ======= RENDER =======
  return (
    <div className="space-y-8">
      {/* ===== Details header + facts & actions ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        {/* gradient blobs */}
        <div className="pointer-events-none absolute -top-20 -right-8 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-400 opacity-60 blur-3xl dark:opacity-40" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 opacity-60 blur-3xl dark:opacity-40" />
        {/* mesh wash */}
        <div
          className="
            absolute inset-0
            [background:
              radial-gradient(120%_80%_at_0%_0%,rgba(99,102,241,.20),transparent_60%),
              radial-gradient(120%_80%_at_100%_0%,rgba(56,189,248,.18),transparent_60%),
              radial-gradient(100%_120%_at_50%_100%,rgba(16,185,129,.16),transparent_55%)
            ]
            dark:[background:
              radial-gradient(120%_80%_at_0%_0%,rgba(99,102,241,.40),transparent_60%),
              radial-gradient(120%_80%_at_100%_0%,rgba(56,189,248,.36),transparent_60%),
              radial-gradient(100%_120%_at_50%_100%,rgba(16,185,129,.30),transparent_55%)
            ]
          "
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/60 to-white/20 dark:from-transparent dark:via-transparent dark:to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_1px)] [background-size:12px_12px] dark:opacity-[0.08]" />

        {/* content */}
        <div className="relative mx-auto max-w-4xl p-6 text-center sm:p-7">
          <h1 className="text-2xl font-semibold text-gray-900 drop-shadow-sm dark:text-white">
            {tour.title}
          </h1>

          {tour.content && tour.content.brief && (
            <p className="mt-1 text-sm text-gray-700/85 dark:text-white/90">
              {(tour?.content?.extended
                ? tour.content.extended
                : tour?.content?.brief
                  ? tour.content.brief
                  : ""
              )
                // remove styles/scripts/comments (optional but handy)
                .replace(/<style[\s\S]*?<\/style>/gi, "")
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<!--[\s\S]*?-->/g, "")
                // strip all tags
                .replace(/<[^>]+>/g, "")
                // decode non-breaking spaces (&nbsp; / &#160; and the Unicode NBSP)
                .replace(/&nbsp;|&#160;/gi, " ")
                .replace(/\u00A0/g, " ")
                // drop zero-width junk
                .replace(/[\u200B-\u200D\uFEFF]/g, "")
                // collapse whitespace and trim
                .replace(/\s+/g, " ")
                .trim() || null}{" "}
            </p>
          )}

          {/* quick facts */}
          <section className="flex items-center justify-center gap-4 pt-5 sm:gap-6">
            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-black/10 backdrop-blur dark:bg-black/40 dark:ring-white/10">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Compass className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">
                  {t("tourDetails.stops")}
                </div>
                <div className="text-sm font-medium">
                  {tour.tourpoints?.length ?? 0}
                </div>
              </div>
            </div>

            {/* <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-black/10 backdrop-blur dark:bg-black/40 dark:ring-white/10">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <Footprints className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">
                  {t("tourDetails.suggestedPace")}
                </div>
                <div className="text-sm font-medium">{difficulty}</div>
              </div>
            </div> */}

            {/* <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-black/10 backdrop-blur dark:bg-black/40 dark:ring-white/10">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-300">
                <Tags className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">
                  {t("tourDetails.tags")}
                </div>
                <div className="text-sm font-medium">{tags.length || '—'}</div>
              </div>
            </div> */}
          </section>

          {/* actions */}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <NavLink
                href={`/tours/detail/navigation?id=${encodeURIComponent(id)}`}
              >
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

      {/* ===== Map ===== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("tourDetails.map")}</h2>

        {tour.tourpoints?.length ? (
          <React.Suspense
            fallback={
              <div className="relative w-full h-[420px] rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse">
                {/* skeleton gradient shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-[shimmer_1.5s_infinite]" />
                <style jsx>{`
            @keyframes shimmer {
              0% {
                background-position: -1000px 0;
              }
              100% {
                background-position: 1000px 0;
              }
            }
          `}</style>
                <div className="absolute bottom-3 left-3 flex gap-3">
                  <div className="h-5 w-20 rounded bg-gray-300/60 dark:bg-gray-600/50" />
                  <div className="h-5 w-28 rounded bg-gray-300/60 dark:bg-gray-600/50" />
                </div>
              </div>
            }
          >
            <MapboxTourMap tour={tour} profile="walking" />
          </React.Suspense>
        ) : (
          <p className="text-sm text-gray-500">{t("tourDetails.noTourPoints")}</p>
        )}
      </section>

      {/* ===== Timeline ===== */}
      <section id="timeline" className="space-y-4">
        <h2 className="text-lg font-semibold">{t("tourDetails.timeline")}</h2>
        {tour?.tourpoints?.length ? (
          <TimelineRight
            places={tour.tourpoints.map((p) => {
              // Import TravelMode from the correct location
              // import { TravelMode } from "@/components/tour/TimelineRight";
              // If TravelMode is an enum, map string to enum value
              let travelMode: TravelMode = "walk";
              if (
                p.traveltype?.name &&
                typeof p.traveltype?.name === "string"
              ) {
                // If TravelMode is an enum, use TravelMode[p.traveltype.name] or a mapping function
                travelMode = p.traveltype.name as TravelMode;
              }
              // --- Handle location safely ---
              const loc = p.monument?.location;
              const lat = Array.isArray(loc) ? loc[1] ?? 0 : loc?.lat ?? 0;
              const lng = Array.isArray(loc) ? loc[0] ?? 0 : loc?.lng ?? 0;
              return {
                id: p._id,
                name: p.monument?.name ?? p.name ?? "",
                address: p.monument?.title ?? "",
                image: p.monument?.image?.secure_url ?? "",
                blurb: p.monument?.content?.brief ?? "",
                location: loc ?? null,
                lat,
                lng,
                kind: p.waypointtype ?? "place",
                travelFromPrev: {
                  mode: travelMode,
                },
                monument: {
                  _id: p.monument?._id ?? "",
                  name: p.monument?.name ?? "",
                  image: p.monument?.image ?? { secure_url: "" },
                  content: p.monument?.content ?? { brief: "", extended: "" },
                  era: p.monument?.era ?? "",
                  size: p.monument?.size ?? "",
                  year: p.monument?.year ?? "",
                  gallery: p.monument?.gallery ?? [],
                  // ✅ normalize location type
                  location: Array.isArray(p.monument?.location)
                    ? (p.monument?.location as [number, number])
                    : [
                      p.monument?.location?.lng ?? 0,
                      p.monument?.location?.lat ?? 0,
                    ],
                  region: p.monument?.region ?? undefined,
                  popularity: p.monument?.popularity ?? 0,
                  imagecredit: p.monument?.imagecredit ?? { en: "", ja: "" },
                  nearbyservices: p.monument?.nearbyservices ?? [],
                  nearbymonuments: p.monument?.nearbymonuments ?? [],
                  subtheme: p.monument?.subtheme ?? [],
                  theme: p.monument?.theme ?? [],
                  artemplates: p.monument?.artemplates ?? [],
                  arenabled: p.monument?.arenabled ?? false,
                  avenabled: p.monument?.avenabled ?? false,
                  rare: p.monument?.rare ?? false,
                  featured: p.monument?.featured ?? false,
                  mtype: p.monument?.mtype ?? "",
                  access: p.monument?.access ?? "",
                  state: p.monument?.state ?? "",
                  title: p.monument?.title ?? "",
                  // ✅ simpler & type-safe
                  georadius: p.monument?.georadius ?? 0,
                },
              };
            })}
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            {t("tourDetails.noTourPoints")}
          </div>
        )}
      </section>
    </div>
  );
}
