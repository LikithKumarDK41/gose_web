// src/app/tours/page.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
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
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { useAppSelector } from '@/lib/store/hook';
import { selectTours } from '@/lib/store/slices/toursSlice';

export default function ToursPage() {
  const tours = useAppSelector(selectTours);
  const hasTours = (tours?.length ?? 0) > 0;

  /* ---------- tags ---------- */
  const tagMeta = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tours ?? []) for (const tag of t.tags ?? []) {
      m.set(tag, (m.get(tag) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [tours]);
  const allTags = useMemo(() => tagMeta.map(([name]) => name), [tagMeta]);

  /* ---------- filters/sort/pagination ---------- */
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'new' | 'stops'>('new');
  const [perPage, setPerPage] = useState(6);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [query, tag, sortBy, perPage]);

  const filteredSorted = useMemo(() => {
    let arr = [...(tours ?? [])];
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          (t.tags ?? []).some((tg) => tg.toLowerCase().includes(q))
      );
    }
    if (tag !== 'all') arr = arr.filter((t) => (t.tags ?? []).includes(tag));
    if (sortBy === 'new') {
      arr.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } else {
      arr.sort((a, b) => (b.places?.length ?? 0) - (a.places?.length ?? 0));
    }
    return arr;
  }, [tours, query, tag, sortBy]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, totalPages);
  const startIdx = (current - 1) * perPage;
  const pageItems = filteredSorted.slice(startIdx, startIdx + perPage);

  const firstId = filteredSorted?.[0]?.id;

  /* ---------- banner stats ---------- */
  const stats = useMemo(() => {
    const totalTours = tours?.length ?? 0;
    const totalStops = (tours ?? []).reduce((s, t) => s + (t.places?.length ?? 0), 0);
    const avgStops = totalTours ? +(totalStops / totalTours).toFixed(1) : 0;
    return { totalTours, totalStops, avgStops, uniqueTags: allTags.length };
  }, [tours, allTags.length]);

  return (
    <div className="space-y-8">
      {/* ===== Rich banner (no CTA buttons; vibrant but readable) ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        {/* Vivid gradient blobs (work well in light & dark) */}
        <div className="pointer-events-none absolute -top-20 -right-8 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-400 opacity-60 blur-3xl dark:opacity-40" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 opacity-60 blur-3xl dark:opacity-40" />
        {/* Soft mesh wash to tie colors together */}
        <div className="absolute inset-0
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
        {/* Veil for light-mode contrast (kept very light) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/60 to-white/20 dark:from-transparent dark:via-transparent dark:to-transparent" />
        {/* Subtle dot texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_1px)] [background-size:12px_12px] dark:opacity-[0.08]" />

        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white shadow ring-1 ring-white/10 backdrop-blur dark:bg-black/60">
              <Sparkles className="h-3.5 w-3.5" />
              Live tours
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 drop-shadow-sm dark:text-white">
              Explore & Navigate Curated Tours
            </h1>
            <p className="text-sm text-gray-700/85 dark:text-white/90">
              Search, filter by tag, sort by newest or most stops, and jump into any tour’s details or navigation.
            </p>
          </div>

          {/* stat chips (kept prominent since there are no CTAs) */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip label="Tours" value={stats.totalTours} />
            <Chip label="Stops" value={stats.totalStops} />
            <Chip label="Avg Stops/Tour" value={stats.avgStops} />
            <Chip label="Tags" value={stats.uniqueTags} />
          </div>
        </div>
      </div>

      {/* ===== Toolbar (shadcn inputs) ===== */}
      <Card className="border bg-card/70 backdrop-blur">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* search */}
            <div>
              <Label htmlFor="q" className="mb-1 block text-xs text-muted-foreground">
                Search
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Title, description, tag…"
                  className="pl-8"
                />
              </div>
            </div>

            {/* tag filter */}
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Tag</Label>
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger className="w-full">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="All tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {allTags.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* sort */}
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Sort by</Label>
              <Select value={sortBy} onValueChange={(v: 'new' | 'stops') => setSortBy(v)}>
                <SelectTrigger className="w-full">
                  <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Newest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Newest</SelectItem>
                  <SelectItem value="stops">Most stops</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* per page */}
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Per page</Label>
              <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
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

          <Separator className="my-3" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{pageItems.length}</span> of{' '}
              <span className="font-semibold text-foreground">{total}</span> result
              {total === 1 ? '' : 's'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                setQuery('');
                setTag('all');
                setSortBy('new');
                setPerPage(6);
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Empty states ===== */}
      {hasTours && total === 0 && (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No tours match your filters.
        </div>
      )}
      {!hasTours && (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No tours yet. Once tours are available, you’ll see them here.
        </div>
      )}

      {/* ===== Grid ===== */}
      {hasTours && total > 0 && (
        <>
          <div className="grid items-stretch gap-7 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((tour, idx) => {
              const isNew =
                !!tour.createdAt &&
                Date.now() - new Date(tour.createdAt).getTime() <
                1000 * 60 * 60 * 24 * 14;
              const frames = [
                "from-indigo-500 via-sky-500 to-emerald-500",
                "from-fuchsia-500 via-violet-500 to-sky-500",
                "from-amber-500 via-orange-500 to-rose-500",
                "from-teal-500 via-emerald-500 to-lime-500",
              ];
              const frame = frames[(startIdx + idx) % frames.length];
              const stops = tour.places.length;
              const busiest = Math.max(
                1,
                ...pageItems.map((t) => t.places.length)
              );
              const stopsPct = Math.min(
                100,
                Math.round((stops / busiest) * 100)
              );

              return (
                <div
                  key={tour.id}
                  className="group relative transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative rounded-2xl bg-card/80 border shadow-sm ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-card/70 dark:ring-white/10">
                    <div className="relative overflow-hidden rounded-t-2xl">
                      {tour.image ? (
                        <img
                          src={tour.image}
                          alt={tour.title}
                          className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="grid h-48 w-full place-items-center bg-muted text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}

                      <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-xs text-gray-900 shadow ring-1 ring-black/10 backdrop-blur dark:bg-black/55 dark:text-white dark:ring-white/10">
                        <MapPin className="h-3.5 w-3.5" />
                        {stops} {stops === 1 ? "stop" : "stops"}
                      </div>

                      <div className="absolute left-2 top-2 flex gap-2">
                        {isNew && (
                          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 shadow backdrop-blur dark:bg-black/70 dark:text-emerald-300">
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 px-4 pb-4 pt-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 text-base font-semibold">
                          {tour.title}
                        </h3>
                        <Sparkles
                          className="h-4 w-4 text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </div>

                      {tour.description && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {tour.description}
                        </p>
                      )}

                      {tour.tags?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {tour.tags.map((tg, i) => {
                            const palettes = [
                              "from-indigo-500/12 to-sky-500/12 text-indigo-700 dark:text-indigo-200",
                              "from-rose-500/12 to-orange-500/12 text-rose-700 dark:text-rose-200",
                              "from-emerald-500/12 to-teal-500/12 text-emerald-700 dark:text-emerald-200",
                              "from-fuchsia-500/12 to-violet-500/12 text-fuchsia-700 dark:text-fuchsia-200",
                            ];
                            const palette = palettes[i % palettes.length];
                            return (
                              <span
                                key={tg}
                                className={`rounded-full border border-white/30 bg-gradient-to-r ${palette} px-2 py-1 text-[11px] font-medium ring-1 ring-black/5 dark:border-white/10`}
                              >
                                {tg}
                              </span>
                            );
                          })}
                        </div>
                      ) : null}

                      <div className="mt-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${frame}`}
                            style={{ width: `${stopsPct}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Stops relative to this page&apos;s busiest tour
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          asChild
                          variant="secondary"
                          className="rounded-full border border-white/40 backdrop-blur-sm dark:border-white/10"
                        >
                          <Link href={`/tours/detail?id=${tour.id}`}>Details</Link>
                        </Button>
                        <Button
                          asChild
                          className="rounded-full bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow hover:from-indigo-700 hover:to-sky-700"
                        >
                          <Link
                            href={`/tours/detail/navigation?id=${tour.id}`}
                          >
                            <Navigation className="mr-1 h-4 w-4" />
                            Navigate
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground">
              Page <span className="text-foreground">{current}</span> of{" "}
              <span className="text-foreground">{totalPages}</span>
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
                Prev
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
                Next
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

function rangeAround(current: number, total: number, radius: number): (number | '…')[] {
  const out: (number | '…')[] = [];
  const start = Math.max(1, current - radius);
  const end = Math.min(total, current + radius);
  if (start > 1) {
    out.push(1);
    if (start > 2) out.push('…');
  }
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total) {
    if (end < total - 1) out.push('…');
    out.push(total);
  }
  return out;
}
