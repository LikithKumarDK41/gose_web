// src/app/library/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppSelector } from "@/lib/store/hook";
import { selectTours } from "@/lib/store/slices/toursSlice";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    Bookmark,
    CheckCircle2,
    Landmark,
    MapPin,
    Navigation,
    Sparkles,
    ImageIcon,
    Compass,
} from "lucide-react";

/* ------------------------------ Types ------------------------------ */
type PlaceCompat = {
    id: string;
    name: string;
    image?: string;
    blurb?: string;
    lat: number;
    lng: number;
    time?: string;
    address?: string;
    tags?: string[];
    kind?: "start" | "place" | "end";
    visitDurationMin?: number;
};
type MonumentItem = PlaceCompat & {
    _tourId: string;
    _tourTitle: string;
};
type TourItem = {
    id: string;
    title: string;
    description?: string;
    image?: string;
    tags?: string[];
    places: PlaceCompat[];
    createdAt?: string;
};

/* Helpers */
const isMonumentLike = (p: PlaceCompat) => {
    const s = `${p.name} ${(p.tags ?? []).join(" ")}`.toLowerCase();
    return ["temple", "monument", "heritage", "well", "library", "shrine"].some((k) =>
        s.includes(k)
    );
};
const fmtDate = (iso?: string) =>
    !iso ? "—" : new Date(iso).toLocaleDateString();

/* ------------------------------ Page ------------------------------ */
export default function LibraryPage() {
    const toursRaw = useAppSelector(selectTours) ?? [];

    // Normalize tours into a simple shape for the UI
    const allTours: TourItem[] = useMemo(
        () =>
            toursRaw.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                image: t.image,
                tags: t.tags ?? [],
                places: (t.places ?? []) as PlaceCompat[],
                createdAt: t.createdAt,
            })),
        [toursRaw]
    );

    // Build monuments by flattening places from tours
    const allMonuments: MonumentItem[] = useMemo(() => {
        const out: MonumentItem[] = [];
        for (const t of allTours) {
            for (const p of t.places) {
                if (isMonumentLike(p)) {
                    out.push({ ...p, _tourId: t.id, _tourTitle: t.title });
                }
            }
        }
        return out;
    }, [allTours]);

    // Fake partition into "bookmarks" vs "visited"
    // (Hook to your real store later — this is only for UI wiring/demo.)
    const bookmarkedTours: TourItem[] = allTours.filter((_, i) => i % 2 === 0);
    const visitedTours: TourItem[] = allTours.filter((_, i) => i % 2 === 1);
    const bookmarkedMonuments: MonumentItem[] = allMonuments.filter((_, i) => i % 2 === 0);
    const visitedMonuments: MonumentItem[] = allMonuments.filter((_, i) => i % 2 === 1);

    // Tabs state (controlled so we can show dynamic counts in the banner)
    const [topTab, setTopTab] = useState<"bookmarks" | "visited">("bookmarks");
    const [innerTab, setInnerTab] = useState<"monuments" | "tours">("monuments");

    const currentCounts = useMemo(() => {
        const bk = {
            mon: bookmarkedMonuments.length,
            tou: bookmarkedTours.length,
        };
        const vs = {
            mon: visitedMonuments.length,
            tou: visitedTours.length,
        };
        const active =
            topTab === "bookmarks"
                ? { mon: bk.mon, tou: bk.tou }
                : { mon: vs.mon, tou: vs.tou };
        const total = active.mon + active.tou;
        return { ...active, total };
    }, [topTab, bookmarkedMonuments.length, bookmarkedTours.length, visitedMonuments.length, visitedTours.length]);

    const dataset =
        topTab === "bookmarks"
            ? innerTab === "monuments"
                ? bookmarkedMonuments
                : bookmarkedTours
            : innerTab === "monuments"
                ? visitedMonuments
                : visitedTours;

    const hasData = dataset.length > 0;

    return (
        <div className="space-y-8">
            {/* ===== Banner (vivid, readable) ===== */}
            <div className="relative overflow-hidden rounded-2xl border">
                {/* Gradient blobs */}
                <div className="pointer-events-none absolute -top-20 -right-8 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-400 opacity-60 blur-3xl dark:opacity-40" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 opacity-60 blur-3xl dark:opacity-40" />
                {/* Mesh wash */}
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
                {/* Veil for light-mode contrast */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/60 to-white/20 dark:from-transparent dark:via-transparent dark:to-transparent" />
                {/* Dot texture */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_1px)] [background-size:12px_12px] dark:opacity-[0.08]" />

                <div className="relative p-6 sm:p-7">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white shadow ring-1 ring-white/10 backdrop-blur dark:bg-black/60">
                                <Sparkles className="h-3.5 w-3.5" />
                                Personal Library
                            </div>
                            <h1 className="mt-2 text-2xl font-semibold text-gray-900 drop-shadow-sm dark:text-white">
                                Bookmarks & Visited Places
                            </h1>
                            <p className="text-sm text-gray-700/85 dark:text-white/90">
                                Quickly jump back to saved spots or review places you’ve explored.
                                Switch tabs to view <b>Monuments</b> or full <b>Tours</b>.
                            </p>
                        </div>

                        {/* Live counters for the active tab */}
                        <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                            <Chip label="Total" value={currentCounts.total} />
                            <Chip label="Monuments" value={currentCounts.mon} />
                            <Chip label="Tours" value={currentCounts.tou} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Top Tabs: Bookmarks / Visited ===== */}
            <Tabs
                value={topTab}
                onValueChange={(v) => setTopTab(v as typeof topTab)}
                className="space-y-6"
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bookmarks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-sky-500 data-[state=active]:text-white">
                        <Bookmark className="mr-2 h-4 w-4" />
                        Bookmarks
                    </TabsTrigger>
                    <TabsTrigger value="visited" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-lime-500 data-[state=active]:text-white">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Visited
                    </TabsTrigger>
                </TabsList>

                {/* ===== Inner Tabs: Monuments / Tours (inside the active top tab) ===== */}
                <TabsContent value="bookmarks" className="space-y-6">
                    <InnerTabs
                        value={innerTab}
                        onChange={(v) => setInnerTab(v)}
                        monuments={bookmarkedMonuments}
                        tours={bookmarkedTours}
                    />
                </TabsContent>

                <TabsContent value="visited" className="space-y-6">
                    <InnerTabs
                        value={innerTab}
                        onChange={(v) => setInnerTab(v)}
                        monuments={visitedMonuments}
                        tours={visitedTours}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

/* ------------------------- Inner Tabs Section ------------------------- */

function InnerTabs({
  value,
  onChange,
  monuments,
  tours,
}: {
  value: "monuments" | "tours";
  onChange: (v: "monuments" | "tours") => void;
  monuments: MonumentItem[];
  tours: TourItem[];
}) {
  const hasMon = monuments.length > 0;
  const hasTours = tours.length > 0;

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as typeof value)}
      className="space-y-5"
    >
      {/* centered equal-width pill tabs */}
      <div className="flex justify-center">
        <TabsList
          className="
            mx-auto flex w-[440px] max-w-full items-center justify-center
            overflow-hidden rounded-full bg-muted/70 p-1 shadow-sm
            ring-1 ring-border
          "
        >
          <TabsTrigger
            value="monuments"
            className="
              flex-1 rounded-full px-4 py-2 text-sm
              data-[state=active]:bg-background data-[state=active]:text-foreground
              data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border
            "
          >
            <Landmark className="mr-2 h-4 w-4" />
            Monuments
          </TabsTrigger>
          <TabsTrigger
            value="tours"
            className="
              flex-1 rounded-full px-4 py-2 text-sm
              data-[state=active]:bg-background data-[state=active]:text-foreground
              data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border
            "
          >
            <Compass className="mr-2 h-4 w-4" />
            Tours
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Monuments grid */}
      <TabsContent value="monuments">
        {!hasMon ? (
          <EmptyState
            icon={<Landmark className="h-8 w-8" />}
            title="No monuments here yet"
            subtitle="Save some places as bookmarks or mark them visited to see them here."
          />
        ) : (
          <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {monuments.map((m) => (
              <MonumentCard key={`${m._tourId}:${m.id}`} m={m} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tours grid */}
      <TabsContent value="tours">
        {!hasTours ? (
          <EmptyState
            icon={<Compass className="h-8 w-8" />}
            title="No tours yet"
            subtitle="When you bookmark or complete tours, they’ll appear here."
          />
        ) : (
          <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {(() => {
              const maxStopsForGrid = Math.max(
                1,
                ...tours.map((tt) => tt.places?.length ?? 0)
              );
              return tours.map((t) => (
                <TourCard key={t.id} t={t} maxStops={maxStopsForGrid} />
              ));
            })()}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

/* ------------------------------ Cards ------------------------------ */

function MonumentCard({ m }: { m: MonumentItem }) {
  return (
    <Card className="group overflow-hidden rounded-[22px] border pt-0 shadow-sm transition-transform hover:-translate-y-0.5">
      {/* Media (unified size) */}
      <div className="relative h-44 w-full overflow-hidden rounded-t-[22px]">
        {m.image ? (
          <img
            src={m.image}
            alt={m.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        {/* Bottom-right overlay pill */}
        <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-xs text-gray-900 shadow ring-1 ring-black/10 backdrop-blur dark:bg-black/55 dark:text-white dark:ring-white/10">
          <Landmark className="h-3.5 w-3.5" />
          Monument
        </div>
      </div>

      <CardHeader className="px-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-semibold">{m.name}</h3>
        </div>
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          From tour: <span className="font-medium text-foreground">{m._tourTitle}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4">
        {m.blurb && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{m.blurb}</p>
        )}

        {!!m.tags?.length && (
          <div className="flex flex-wrap gap-1.5">
            {m.tags.slice(0, 4).map((tg, i) => (
              <span
                key={tg + i}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                style={{
                  background:
                    i % 4 === 0
                      ? "linear-gradient(180deg, rgba(99,102,241,.10), rgba(56,189,248,.10))"
                      : i % 4 === 1
                      ? "linear-gradient(180deg, rgba(244,63,94,.10), rgba(251,146,60,.10))"
                      : i % 4 === 2
                      ? "linear-gradient(180deg, rgba(16,185,129,.10), rgba(20,184,166,.10))"
                      : "linear-gradient(180deg, rgba(217,70,239,.10), rgba(139,92,246,.10))",
                  color:
                    i % 4 === 0
                      ? "#1f3a8a"
                      : i % 4 === 1
                      ? "#7f1d1d"
                      : i % 4 === 2
                      ? "#065f46"
                      : "#6d28d9",
                }}
              >
                {tg}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="secondary" className="rounded-full">
            <Link href={`/tours/detail?id=${encodeURIComponent(m._tourId)}#timeline`}>
              Details
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-full text-white shadow"
            style={{
              background: "linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)",
            }}
          >
            <Link href={`/tours/detail/navigation?id=${encodeURIComponent(m._tourId)}`}>
              <Navigation className="mr-1 h-4 w-4" />
              Navigate
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


function TourCard({ t, maxStops }: { t: TourItem; maxStops: number }) {
  const stops = t.places?.length ?? 0;
  const progress = Math.min(
    100,
    Math.round((stops / Math.max(1, maxStops)) * 100)
  );

  return (
    <Card className="group overflow-hidden rounded-[22px] border pt-0 shadow-sm transition-transform hover:-translate-y-0.5">
      {/* Media with bottom-right overlay pill (stops only) */}
      <div className="relative h-44 w-full overflow-hidden rounded-t-[22px]">
        {t.image ? (
          <img
            src={t.image}
            alt={t.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-xs text-gray-900 shadow ring-1 ring-black/10 backdrop-blur dark:bg-black/55 dark:text-white dark:ring-white/10">
          <MapPin className="h-3.5 w-3.5" />
          {stops} {stops === 1 ? "stop" : "stops"}
        </div>
      </div>

      <CardHeader className="px-4 pt-3">
        <h3 className="line-clamp-1 text-base font-semibold">{t.title}</h3>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4">
        {t.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {t.description}
          </p>
        )}

        {!!t.tags?.length && (
          <div className="flex flex-wrap gap-1.5">
            {t.tags.slice(0, 6).map((tg, i) => (
              <span
                key={tg + i}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                style={{
                  background:
                    i % 4 === 0
                      ? "linear-gradient(180deg, rgba(99,102,241,.10), rgba(56,189,248,.10))"
                      : i % 4 === 1
                      ? "linear-gradient(180deg, rgba(244,63,94,.10), rgba(251,146,60,.10))"
                      : i % 4 === 2
                      ? "linear-gradient(180deg, rgba(16,185,129,.10), rgba(20,184,166,.10))"
                      : "linear-gradient(180deg, rgba(217,70,239,.10), rgba(139,92,246,.10))",
                  color:
                    i % 4 === 0
                      ? "#1f3a8a"
                      : i % 4 === 1
                      ? "#7f1d1d"
                      : i % 4 === 2
                      ? "#065f46"
                      : "#6d28d9",
                }}
              >
                {tg}
              </span>
            ))}
          </div>
        )}

        {/* Gradient progress */}
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background:
                  "linear-gradient(90deg, #6366f1 0%, #38bdf8 50%, #34d399 100%)",
              }}
            />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Stops relative to this page’s busiest tour
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="secondary" className="rounded-full">
            <Link href={`/tours/detail?id=${encodeURIComponent(t.id)}`}>
              Details
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-full text-white shadow"
            style={{
              background: "linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)",
            }}
          >
            <Link href={`/tours/detail/navigation?id=${encodeURIComponent(t.id)}`}>
              <Navigation className="mr-1 h-4 w-4" />
              Navigate
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Bits ------------------------------ */

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

function EmptyState({
    icon,
    title,
    subtitle,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="grid place-items-center rounded-xl border p-10 text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                {icon}
            </div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-1 max-w-md text-xs text-muted-foreground">{subtitle}</div>
            <div className="mt-4">
                <Button asChild variant="secondary" className="rounded-full">
                    <Link href="/tours">Browse tours</Link>
                </Button>
            </div>
        </div>
    );
}
