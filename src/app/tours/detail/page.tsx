'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MapboxTourMap from '@/components/map/MapboxTourMap';
import NavLink from '@/components/nav/NavLink';
import { useAppSelector } from '@/lib/store/hook';
import { selectTourById } from '@/lib/store/slices/toursSlice';
import TimelineRight from '@/components/tour/TimelineRight';
import { Compass, Footprints, Tags } from 'lucide-react';

export default function TourDetailsClientPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get('id') ?? '';

  const selector = useMemo(() => selectTourById(id), [id]);
  const tour = useAppSelector(selector);

  // Client-only redirects
  useEffect(() => {
    if (!id) router.replace('/tours'); // list page
    else if (!tour) router.replace('/404');
  }, [id, tour, router]);

  if (!id || !tour) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const tags = tour.tags ?? [];
  const difficulty =
    tags.includes('Easy') ? 'Easy' : tags.includes('Moderate') ? 'Moderate' : 'Casual';

  return (
    <div className="space-y-8">
      {/* ===== Details header (same BG & spacing as list banner) + facts & actions, centered ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        {/* vivid gradient blobs */}
        <div className="pointer-events-none absolute -top-20 -right-8 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-400 opacity-60 blur-3xl dark:opacity-40" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 opacity-60 blur-3xl dark:opacity-40" />
        {/* soft mesh wash */}
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
        {/* veil for light-mode contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/60 to-white/20 dark:from-transparent dark:via-transparent dark:to-transparent" />
        {/* subtle dot texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_1px)] [background-size:12px_12px] dark:opacity-[0.08]" />

        {/* content */}
        <div className="relative mx-auto max-w-4xl p-6 text-center sm:p-7">
          <h1 className="text-2xl font-semibold text-gray-900 drop-shadow-sm dark:text-white">
            {tour.title}
          </h1>

          {tour.description && (
            <p className="mt-1 text-sm text-gray-700/85 dark:text-white/90">
              {tour.description}
            </p>
          )}

          {!!tour.tags?.length && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {tour.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/30 bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-900 shadow ring-1 ring-black/10 backdrop-blur dark:border-white/10 dark:bg-black/60 dark:text-white/90"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* quick facts inside banner */}
          <section className="mx-auto mt-5 grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-black/10 backdrop-blur dark:bg-black/40 dark:ring-white/10">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Compass className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Stops</div>
                <div className="text-sm font-medium">{tour.places.length}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-black/10 backdrop-blur dark:bg-black/40 dark:ring-white/10">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <Footprints className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Suggested Pace</div>
                <div className="text-sm font-medium">{difficulty}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-black/10 backdrop-blur dark:bg-black/40 dark:ring-white/10">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-300">
                <Tags className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Tags</div>
                <div className="text-sm font-medium">{tags.length || '—'}</div>
              </div>
            </div>
          </section>

          {/* actions inside banner */}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <NavLink href={`/tours/detail/navigation?id=${encodeURIComponent(id)}`}>
                Start Navigation
              </NavLink>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#timeline">Jump to Timeline</a>
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Map ===== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Map</h2>
        <MapboxTourMap places={tour.places} profile="walking" />
      </section>

      {/* ===== Timeline (all right) ===== */}
      <section id="timeline" className="space-y-4">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <TimelineRight places={tour.places} />
      </section>
    </div>
  );
}
