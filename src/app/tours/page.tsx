"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  ImageIcon,
  MapPin,
  Navigation,
  Sparkles,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { useAppSelector, useAppDispatch } from "@/lib/store/hook";
import { fetchTours, selectTours } from "@/lib/store/slices/touristSlice";
import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";

export default function ToursPage() {
  const { t } = useLocale();
  const dispatch = useAppDispatch();
  const tours = useAppSelector(selectTours);
  const hasTours = (tours?.length ?? 0) > 0;

  /* ---------- tags ---------- */
 

  /* ---------- filters/sort/pagination ---------- */
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"new" | "stops">("new");
  const [perPage, setPerPage] = useState(6);
  const [page, setPage] = useState(1);
  const { show, hide } = useGlobalLoader();
  useEffect(() => setPage(1), [query, tag, sortBy, perPage]);

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

  const filteredSorted = useMemo(() => {
    let arr = [...(tours ?? [])];
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }
    return arr;
  }, [tours, query, tag, sortBy]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, totalPages);
  const startIdx = (current - 1) * perPage;
  const pageItems = filteredSorted.slice(startIdx, startIdx + perPage);

  /* ---------- banner stats ---------- */
  const stats = useMemo(() => {
    const totalTours = tours?.length ?? 0;
    const totalStops = (tours ?? []).reduce(
      (s, t) => s + (t.places?.length ?? 0),
      0
    );
    const avgStops = totalTours ? +(totalStops / totalTours).toFixed(1) : 0;
    return { totalTours, totalStops, avgStops };
  }, [tours]);

  return (
    <div className="space-y-8">
      {/* ===== Rich banner ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        {/* gradient blobs */}
        <div className="pointer-events-none absolute -top-20 -right-8 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-400 opacity-60 blur-3xl dark:opacity-40" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 opacity-60 blur-3xl dark:opacity-40" />
        {/* mesh wash */}
        <div
          className="absolute inset-0
          [background:
            radial-gradient(120%_80%_at_0%_0%,rgba(99,102,241,.20),transparent_60%),
            radial-gradient(120%_80%_at_100%_0%,rgba(56,189,248,.18),transparent_60%),
            radial-gradient(100%_120%_at_50%_100%,rgba(16,185,129,.16),transparent_55%)
          ]
          dark:[background:
            radial-gradient(120%_80%_at_0%_0%,rgba(99,102,241,.40),transparent_60%),
            radial-gradient(120%_80%_at_100%_0%,rgba(56,189,248,.36),transparent_60%),
            radial-gradient(100%_120%_at_50%_100%,rgba(16,185,129,.30),transparent_55%)
          ]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/60 to-white/20 dark:from-transparent dark:via-transparent dark:to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_1px)] [background-size:12px_12px] dark:opacity-[0.08]" />

        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white shadow ring-1 ring-white/10 backdrop-blur dark:bg-black/60">
              <Sparkles className="h-3.5 w-3.5" />
              {t("tours.liveTours")}
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 drop-shadow-sm dark:text-white">
              {t("tours.exploreTours")}
            </h1>
            <p className="text-sm text-gray-700/85 dark:text-white/90">
              {t("tours.bannerDescription")}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip label={t("tours.stats.tours")} value={stats.totalTours} />
          </div>
        </div>
      </div>

      {/* ===== Toolbar ===== */}
      <Card className="border bg-card/70 backdrop-blur">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="hidden lg:block md:hidden sm:hidden">

            </div>
            <div>
              <Label
                htmlFor="q"
                className="mb-1 block text-xs text-muted-foreground"
              >
                {t("tours.search")}
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("tours.searchPlaceholder")}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="hidden lg:block md:hidden sm:hidden">
              <Label className="mb-1 block text-xs text-muted-foreground">
                {t("tours.perPage")}
              </Label>
              <Select
                value={String(perPage)}
                onValueChange={(v) => setPerPage(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[6, 9, 12, 18].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="block lg:hidden md:block sm:block">
              <Label className="mb-1 block text-xs text-muted-foreground">
                {t("tours.perPage")}
              </Label>
              <Select
                value={String(perPage)}
                onValueChange={(v) => setPerPage(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[6, 9, 12, 18].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>            
          </div>


          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {t("tours.showingResults", { current: pageItems.length, total })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                setQuery("");
                setTag("all");
                setSortBy("new");
                setPerPage(6);
              }}
            >
              {t("tours.reset")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Empty states ===== */}
      {hasTours && total === 0 && (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          {t("tours.noMatches")}
        </div>
      )}
      {!hasTours && (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          {t("tours.noToursYet")}
        </div>
      )}

      {/* ===== Grid ===== */}
      {hasTours && total > 0 && (
        <>
          <div className="grid  gap-7 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((tour, idx) => {
              return (
                <div
                  key={idx}
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
                        <Link href={`/tours/detail?id=${tour._id}`}>
                          Details
                        </Link>
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
              );
            })}
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground">
              {t("tours.pageOf", { current, total: totalPages })}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {t("tours.prev")}
              </Button>
              <div className="hidden sm:flex items-center gap-1">
                {rangeAround(current, totalPages, 2).map((n, i) =>
                  n === "…" ? (
                    <span
                      key={`dots-${i}`}
                      className="px-2 text-sm text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={[
                        "h-8 min-w-8 rounded-md px-2 text-sm",
                        n === current
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      ].join(" ")}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current >= totalPages}
              >
                {t("tours.next")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function Chip({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-gray-900 shadow ring-1 ring-black/10 backdrop-blur dark:bg-black/60 dark:text-white/90 dark:ring-white/10">
      {label}
      <span className="rounded bg-black/5 px-1.5 text-[10px] font-semibold dark:bg-white/10">
        {value}
      </span>
    </span>
  );
}

function rangeAround(
  current: number,
  total: number,
  radius: number
): (number | "…")[] {
  const out: (number | "…")[] = [];
  const start = Math.max(1, current - radius);
  const end = Math.min(total, current + radius);
  if (start > 1) {
    out.push(1);
    if (start > 2) out.push("…");
  }
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total) {
    if (end < total - 1) out.push("…");
    out.push(total);
  }
  return out;
}
