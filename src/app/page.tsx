// src/app/tours/page.tsx (or wherever you keep it)
"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import {
  ImageIcon,
  PlayCircle,
  PauseCircle,
  Route,
  Sparkles,
  Navigation,
  Compass,
  MapPinned,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppSelector, useAppDispatch } from "@/lib/store/hook";
import { fetchTours, selectTours } from "@/lib/store/slices/touristSlice";
import { selectNav } from "@/lib/store/slices/navSlice";
import { selectGeofenceChecked } from "@/lib/store/slices/geofenceSlice";
import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";

export default function ToursDashboardPage() {
  const { t } = useLocale();
  const dispatch = useAppDispatch();
  const { show, hide } = useGlobalLoader();

  const tours = useAppSelector(selectTours);
  const nav = useAppSelector(selectNav);
  const checkedMap = useAppSelector(selectGeofenceChecked);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        show(); // loader visible immediately
        await dispatch(fetchTours());
      } finally {
        if (mounted) hide(); // hide only after data is loaded
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [dispatch, show, hide]);

  const metrics = useMemo(() => {
    const totalTours = tours?.length ?? 0;
    const totalStops = (tours ?? []).reduce(
      (sum, t) => sum + (t.places?.length ?? 0),
      0
    );
    let visited = 0;
    for (const t of tours ?? []) {
      for (const p of t.places ?? []) {
        if (checkedMap[p.id]) visited++;
      }
    }
    const pending = Math.max(0, totalStops - visited);
    const completion = totalStops
      ? Math.round((visited / totalStops) * 100)
      : 0;
    const avgStops = totalTours ? +(totalStops / totalTours).toFixed(1) : 0;

    return {
      totalTours,
      totalStops,
      visited,
      pending,
      completion,
      avgStops,
    };
  }, [tours, checkedMap]);

  const hasTours = (tours?.length ?? 0) > 0;

  return (
    <div className="space-y-12">
      {/* ===== Hero ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 opacity-90 dark:opacity-80" />
        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs text-white backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.liveTourTracking")}
            </div>
            <h1 className="text-2xl font-semibold text-white drop-shadow-sm">
              {t("dashboard.title")}
            </h1>
            <p className="max-w-2xl text-sm text-white/90">
              {t("dashboard.description")}
            </p>
          </div>

          {/* Nav status pill */}
          <div className="flex items-center gap-3 rounded-xl bg-white/15 p-3 text-white backdrop-blur">
            <span
              className={`grid h-9 w-9 place-items-center rounded-full shadow ${
                nav.status === "running"
                  ? "bg-emerald-500"
                  : nav.status === "paused"
                  ? "bg-amber-500"
                  : "bg-slate-400"
              }`}
            >
              {nav.status === "running" ? (
                <PlayCircle className="h-5 w-5" />
              ) : nav.status === "paused" ? (
                <PauseCircle className="h-5 w-5" />
              ) : (
                <Route className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold capitalize">
                {t(`nav.status.${nav.status}`)}
              </div>
              <div className="text-xs/5 opacity-90">
                {tours?.length > 0 ? tours[0].title : t("nav.noActiveTour")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Global KPIs ===== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          icon={<Compass className="h-5 w-5" />}
          label="Total Tours"
          value={metrics.totalTours}
          gradient="from-indigo-500 to-blue-500"
        />
        <Kpi
          icon={<MapPinned className="h-5 w-5" />}
          label="Total Stops"
          value={metrics.totalStops}
          gradient="from-emerald-500 to-lime-500"
        />
        <Kpi
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg Stops"
          value={metrics.avgStops}
          gradient="from-fuchsia-500 to-pink-500"
        />
      </div>

      {/* ===== Tours grid ===== */}
      {hasTours && (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {tours.slice(0, 6).map((tour) => (
            <div
              key={tour._id}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm"
            >
              {/* media */}
              <div className="relative h-48 w-full overflow-hidden">
                {tour.image?.secure_url ? (
                  <img
                    src={tour.image.secure_url}
                    alt={tour.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>

              {/* content */}
              <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
                <div>
                  <h3 className="line-clamp-1 text-base font-semibold">
                    {tour.title}
                  </h3>
                  {tour.content?.brief && (
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {(tour?.content?.brief || "")
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
                </div>

                {/* buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="secondary">
                    <Link href={`/tours/detail?id=${tour._id}`}>Details</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white"
                  >
                    <Link href={`/tours/detail/navigation?id=${tour._id}`}>
                      <Navigation className="mr-1 h-4 w-4" />
                      Navigate
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tours.length > 6 && (
        <div className="mt-6 flex justify-center">
          <Button asChild className="rounded-full">
            <Link href="/tours">Show More</Link>
          </Button>
        </div>
      )}

      {/* ===== Featured Highlight ===== */}
      {tours.find((t) => t.featured) && (
        <div className="rounded-2xl border bg-gradient-to-r from-sky-500/10 to-indigo-500/10 p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Featured Highlight</h2>
          {(() => {
            const ft = tours.find((t) => t.featured);
            if (!ft) return null;
            return (
              <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                <img
                  src={ft.image?.secure_url}
                  alt={ft.title}
                  className="h-40 w-64 rounded-xl object-cover shadow"
                />
                <div>
                  <h3 className="text-lg font-bold">{ft.title}</h3>
                  {ft.content?.brief && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {ft.content.brief.replace(/<[^>]+>/g, "")}
                    </p>
                  )}
                  <Button asChild size="sm" className="mt-3">
                    <Link href={`/tours/detail?id=${ft._id}`}>Explore Now</Link>
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {!hasTours && (
        <div className="rounded-xl border p-10 text-center">
          <p className="text-sm text-muted-foreground">No Tours Available</p>
        </div>
      )}
    </div>
  );
}

/* ---------- small UI atoms ---------- */
function Kpi({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border">
      <div
        className={`pointer-events-none absolute -inset-2 opacity-[0.18] blur-2xl bg-gradient-to-r ${gradient}`}
      />
      <div className="relative flex items-center gap-4 p-4">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}
