'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ImageIcon,
  MapPinned,
  Compass,
  Tags,
  TrendingUp,
  PlayCircle,
  PauseCircle,
  Route,
  Navigation2,
  Clock4,
  Sparkles,
  MapPin, Navigation
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useAppSelector } from '@/lib/store/hook';
import { selectTours, selectActiveTour } from '@/lib/store/slices/toursSlice';
import { selectNav } from '@/lib/store/slices/navSlice';
import { selectGeofenceChecked } from '@/lib/store/slices/geofenceSlice';

/* ---------- helpers ---------- */
function prettyStats(s?: { distance: number; duration: number } | null) {
  if (!s) return '—';
  const km = (s.distance / 1000).toFixed(2);
  const mins = Math.round(s.duration / 60);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${km} km • ${hh ? `${hh}h ` : ''}${mm}m`;
}

export default function ToursDashboardPage() {
  const tours = useAppSelector(selectTours);
  const activeTour = useAppSelector(selectActiveTour);
  const nav = useAppSelector(selectNav);
  const checkedMap = useAppSelector(selectGeofenceChecked);

  const metrics = useMemo(() => {
    const totalTours = tours?.length ?? 0;
    const totalStops = (tours ?? []).reduce((sum, t) => sum + (t.places?.length ?? 0), 0);
    let visited = 0;
    for (const t of tours ?? []) for (const p of t.places) if (checkedMap[p.id]) visited++;
    const pending = Math.max(0, totalStops - visited);
    const completion = totalStops ? Math.round((visited / totalStops) * 100) : 0;
    const avgStops = totalTours ? +(totalStops / totalTours).toFixed(1) : 0;

    const tagCount = new Map<string, number>();
    for (const t of tours ?? []) for (const tag of t.tags ?? []) tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    const uniqueTags = tagCount.size;
    const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));

    const recent = [...(tours ?? [])]
      .sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()))
      .slice(0, 3);

    return { totalTours, totalStops, visited, pending, completion, avgStops, uniqueTags, topTags, recent };
  }, [tours, checkedMap]);

  const perTourProgress = useMemo(() => {
    return (tours ?? []).map((t) => {
      const v = t.places.filter((p) => checkedMap[p.id]).length;
      const total = t.places.length || 1;
      return { id: t.id, title: t.title, img: t.image, visited: v, total, pct: Math.round((v / total) * 100) };
    }).sort((a, b) => b.pct - a.pct);
  }, [tours, checkedMap]);

  const hasTours = (tours?.length ?? 0) > 0;

  const maxStops = Math.max(1, ...(tours ?? []).map(t => t.places?.length ?? 0));

  return (
    <div className="space-y-8">
      {/* ===== Hero (vivid) ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        {/* gradient wash + floating blobs */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 opacity-90 dark:opacity-80" />
        <div className="pointer-events-none absolute -top-16 -right-20 h-64 w-64 rounded-full bg-white/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-16 h-56 w-56 rounded-full bg-sky-300/20 blur-2xl dark:bg-sky-200/10" />

        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs text-white backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              live tour tracking
            </div>
            <h1 className="text-2xl font-semibold text-white drop-shadow-sm">Tours Dashboard</h1>
            <p className="max-w-2xl text-sm text-white/90">
              See navigation status, progress across all tours, and jump into a trip instantly.
            </p>
          </div>

          {/* Active pill */}
          <div className="flex items-center gap-3 rounded-xl bg-white/15 p-3 text-white backdrop-blur">
            <span
              className={`grid h-9 w-9 place-items-center rounded-full shadow ${nav.status === 'running' ? 'bg-emerald-500' : nav.status === 'paused' ? 'bg-amber-500' : 'bg-slate-400'
                }`}
            >
              {nav.status === 'running' ? <PlayCircle className="h-5 w-5" /> :
                nav.status === 'paused' ? <PauseCircle className="h-5 w-5" /> :
                  <Route className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold capitalize">{nav.status}</div>
              <div className="text-xs/5 opacity-90">
                {activeTour ? activeTour.title : 'No active tour'}
              </div>
            </div>
            {activeTour && (
              <Button asChild size="sm" className="ml-2 bg-white text-gray-900 hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/80">
                <Link href={`/tours/detail/navigation?id=${activeTour.id}`}>
                  <Navigation2 className="mr-1.5 h-4 w-4" /> Resume
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ===== Global KPIs ===== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Compass className="h-5 w-5" />} label="Total Tours" value={metrics.totalTours} gradient="from-indigo-500 to-blue-500" />
        <Kpi icon={<MapPinned className="h-5 w-5" />} label="Total Stops" value={metrics.totalStops} gradient="from-emerald-500 to-lime-500" />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Avg Stops / Tour" value={metrics.avgStops} gradient="from-fuchsia-500 to-pink-500" />
        <Kpi icon={<Tags className="h-5 w-5" />} label="Unique Tags" value={metrics.uniqueTags} gradient="from-amber-500 to-orange-500" />
      </div>

      {/* ===== Active navigation + Overview ===== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active navigation status */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="border-b px-5 py-3">
            <div className="text-sm font-semibold">Active Navigation</div>
            <div className="text-xs text-muted-foreground">Live session pulled from Redux</div>
          </div>
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <GlassTile title="Status" subtitle="Current session">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${nav.status === 'running' ? 'bg-emerald-500' : nav.status === 'paused' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                  />
                  <span className="font-semibold capitalize">{nav.status}</span>
                </div>
                <div className="text-xs text-muted-foreground">Profile: <span className="uppercase">{nav.profile}</span></div>
              </GlassTile>

              <GlassTile title="Route" subtitle="Distance • ETA">
                <div className="flex items-center gap-2">
                  <Clock4 className="h-4 w-4 text-indigo-500" />
                  <span className="font-semibold">{prettyStats(nav.stats)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{activeTour ? activeTour.title : '—'}</div>
              </GlassTile>

              <GlassTile title="Actions" subtitle="Quick access">
                <div className="flex flex-wrap gap-2">
                  {activeTour ? (
                    <>
                      <Button asChild size="sm" className="gap-2">
                        <Link href={`/tours/detail/navigation?id=${activeTour.id}`}>
                          <Navigation2 className="h-4 w-4" /> Map
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/tours/detail?id=${activeTour.id}`}>Details</Link>
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Choose a tour below to start.</span>
                  )}
                </div>
              </GlassTile>
            </div>
          </CardContent>
        </Card>

        {/* Overview with colorful radial completion */}
        <Card>
          <div className="border-b px-5 py-3">
            <div className="text-sm font-semibold">Activity Overview</div>
            <div className="text-xs text-muted-foreground">Check-ins across all tours</div>
          </div>
          <CardContent className="p-5">
            <div className="flex items-center gap-5">
              {/* Radial */}
              <div className="relative h-28 w-28">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#22c55e ${metrics.completion * 3.6}deg, rgba(100,116,139,.25) 0deg)`,
                  }}
                />
                <div className="absolute inset-2 rounded-full bg-background" />
                <div className="relative grid h-full w-full place-items-center text-center">
                  <div className="text-xl font-semibold">{metrics.completion}%</div>
                  <div className="text-[10px] text-muted-foreground -mt-1">complete</div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <Bar label="Visited" value={metrics.visited} gradient="from-emerald-500 to-lime-500" />
                <Bar label="Pending" value={metrics.pending} gradient="from-rose-500 to-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Quick Launch carousel (colorful) ===== */}
      {hasTours && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick Launch</h2>
            <div className="text-xs text-muted-foreground">Jump straight into a tour</div>
          </div>

          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
            {(tours ?? []).map((t, i) => (
              <article
                key={t.id}
                className="group relative min-w-[280px] flex-1 overflow-hidden rounded-2xl border"
              >
                {/* background image or gradient */}
                {t.image ? (
                  // image bg
                  <img src={t.image} alt={t.title} className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 opacity-50" />
                )}
                {/* glass overlay */}
                <div className="relative flex h-36 items-end justify-between gap-3 p-4 backdrop-blur-sm">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white drop-shadow">{t.title}</div>
                    <div className="text-[11px] text-white/90 drop-shadow">
                      {t.places.length} stops • {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="secondary" className="bg-white/90 text-gray-900 hover:bg-white">
                      <Link href={`/tours/detail?id=${t.id}`}>Details</Link>
                    </Button>
                    <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-600/90">
                      <Link href={`/tours/detail/navigation?id=${t.id}`}>Navigate</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ===== Progress by tour + Top tags ===== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress by tour */}
        <Card className="lg:col-span-2">
          <div className="border-b px-5 py-3">
            <div className="text-sm font-semibold">Tours Progress</div>
            <div className="text-xs text-muted-foreground">Visited stops vs total per tour</div>
          </div>
          <CardContent className="p-5">
            {perTourProgress.length === 0 ? (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Nothing to show yet.</div>
            ) : (
              <ul className="space-y-3">
                {perTourProgress.map((t) => (
                  <li key={t.id} className="rounded-xl border p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 overflow-hidden rounded-md bg-muted">
                        {t.img ? (
                          <img src={t.img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold">{t.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.visited}/{t.total} • {t.pct}%
                          </div>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all"
                            style={{ width: `${t.pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-2 hidden sm:block">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/tours/detail?id=${t.id}`}>Open</Link>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card>
          <div className="border-b px-5 py-3">
            <div className="text-sm font-semibold">Top Tags</div>
            <div className="text-xs text-muted-foreground">Most-used across your tours</div>
          </div>
          <CardContent className="p-5">
            {metrics.topTags.length === 0 ? (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No tags yet.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {metrics.topTags.map((t, i) => (
                  <Badge
                    key={t.name}
                    variant="secondary"
                    className="gap-2 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-900 ring-1 ring-sky-500/30 dark:text-sky-100"
                  >
                    {t.name}
                    <span className="rounded bg-white/60 px-1.5 text-[10px] font-semibold text-sky-700 dark:bg-white/10 dark:text-sky-100">
                      {t.count}
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Recently created ===== */}
      <Card>
        <div className="border-b px-5 py-3">
          <div className="text-sm font-semibold">Recently Created</div>
          <div className="text-xs text-muted-foreground">Last three tours</div>
        </div>
        <CardContent className="p-5">
          {metrics.recent.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No recent tours to show.</div>
          ) : (
            <ul className="space-y-3">
              {metrics.recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-transform hover:-translate-y-0.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'} • {t.places.length} stops
                    </div>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/tours/detail?id=${t.id}`}>Open</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ===== All tours grid ===== */}
      {hasTours && (
        <>
          <div className="flex items-center justify-between" id="all-tours">
            <h2 className="text-lg font-semibold">All Tours</h2>
            <div className="text-xs text-muted-foreground">
              {metrics.totalTours} total • {metrics.totalStops} stops
            </div>
          </div>


          <div className="grid items-stretch gap-7 md:grid-cols-2 xl:grid-cols-3">
            {tours!.map((tour, idx) => {
              const isNew =
                !!tour.createdAt &&
                Date.now() - new Date(tour.createdAt).getTime() < 1000 * 60 * 60 * 24 * 14;

              // slight variation per card so gradients don’t all look the same
              const frames = [
                "from-indigo-500 via-sky-500 to-emerald-500",
                "from-fuchsia-500 via-violet-500 to-sky-500",
                "from-amber-500 via-orange-500 to-rose-500",
                "from-teal-500 via-emerald-500 to-lime-500",
              ];
              const frame = frames[idx % frames.length];

              const stops = tour.places.length;
              const stopsPct = Math.min(100, Math.round((stops / maxStops) * 100));

              return (
                <div key={tour.id} className="group relative">
                  {/* Aurora frame */}
                  <div className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r ${frame} opacity-80 blur-sm transition-opacity group-hover:opacity-100`} />
                  {/* Card body with 1px gradient border */}
                  <div className="relative rounded-2xl bg-card/80 ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-card/70 dark:ring-white/10">
                    {/* top shimmer accent */}
                    <div className={`pointer-events-none absolute -inset-x-10 -top-10 h-24 bg-gradient-to-r ${frame} opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-40`} />

                    {/* media */}
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

                      {/* glass info bar on image */}
                      <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-xs text-gray-900 shadow ring-1 ring-black/10 backdrop-blur dark:bg-black/55 dark:text-white dark:ring-white/10">
                        <MapPin className="h-3.5 w-3.5" />
                        {stops} {stops === 1 ? "stop" : "stops"}
                      </div>

                      {/* corner ribbons */}
                      <div className="absolute left-2 top-2 flex gap-2">
                        {isNew && (
                          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 shadow backdrop-blur dark:bg-black/70 dark:text-emerald-300">
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    {/* content */}
                    <div className="space-y-3 px-4 pb-4 pt-3">
                      {/* title row */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 text-base font-semibold">{tour.title}</h3>
                        <Sparkles
                          className="h-4 w-4 text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </div>

                      {/* description */}
                      {tour.description && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {tour.description}
                        </p>
                      )}

                      {/* tags: soft colorful pills */}
                      {tour.tags?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {tour.tags.map((tag, i) => {
                            const tagPalettes = [
                              "from-indigo-500/12 to-sky-500/12 text-indigo-700 dark:text-indigo-200",
                              "from-rose-500/12 to-orange-500/12 text-rose-700 dark:text-rose-200",
                              "from-emerald-500/12 to-teal-500/12 text-emerald-700 dark:text-emerald-200",
                              "from-fuchsia-500/12 to-violet-500/12 text-fuchsia-700 dark:text-fuchsia-200",
                            ];
                            const palette = tagPalettes[i % tagPalettes.length];
                            return (
                              <span
                                key={tag}
                                className={`rounded-full border border-white/30 bg-gradient-to-r ${palette} px-2 py-1 text-[11px] font-medium ring-1 ring-black/5 dark:border-white/10`}
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      ) : null}

                      {/* stops progress bar relative to max */}
                      <div className="mt-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${frame}`}
                            style={{ width: `${stopsPct}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Stops relative to your busiest tour
                        </div>
                      </div>

                      {/* actions */}
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
                          <Link href={`/tours/detail/navigation?id=${tour.id}`}>
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

        </>
      )}

      {!hasTours && (
        <div className="rounded-xl border p-10 text-center">
          <div className="mx-auto max-w-md space-y-3">
            <div className="text-xl font-semibold">No tours available</div>
            <p className="text-sm text-muted-foreground">Import or enable sample tours to get started.</p>
            <Button asChild>
              <Link href="/tours/detail?id=hoskeralli">Open Sample Tour</Link>
            </Button>
          </div>
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
  gradient: string; // "from-indigo-500 to-blue-500"
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border">
      <div className={`pointer-events-none absolute -inset-2 opacity-[0.18] blur-2xl bg-gradient-to-r ${gradient}`} />
      <div className="relative flex items-center gap-4 p-4">
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
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

function GlassTile({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-gradient-to-b from-white/70 to-white/40 p-3 backdrop-blur dark:from-white/10 dark:to-white/5">
      <div className="text-xs font-semibold">{title}</div>
      {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function Bar({ label, value, gradient }: { label: string; value: number | string; gradient: string }) {
  const pct = typeof value === 'number' ? value : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded bg-muted">
        <div className={`h-full bg-gradient-to-r ${gradient}`} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
