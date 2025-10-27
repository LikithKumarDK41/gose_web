"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { selectTours, fetchTours } from "@/lib/store/slices/touristSlice";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, Bookmark, CheckCircle2, Navigation, Compass, ImageIcon, Sparkles, MapPin } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type PlaceCompat = {
  _id?: string;
  id?: string;
  name: string;
  image?: string;
  blurb?: string;
  lat?: number;
  lng?: number;
  kind?: "start" | "place" | "end";
  tags?: string[];
};

type MonumentItem = PlaceCompat & {
  _tourId: string;
  _tourTitle: string;
};

type TourItem = {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  tourpoints?: PlaceCompat[];
};

/* -------------------------------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------------------------------- */

const isMonumentLike = (p: PlaceCompat) => {
  const s = `${p.name} ${(p.tags ?? []).join(" ")}`.toLowerCase();
  return ["temple", "monument", "heritage", "well", "library", "shrine"].some((k) =>
    s.includes(k)
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------------------------------- */

export default function LibraryPage() {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const toursRaw = useAppSelector(selectTours);
  const [topTab, setTopTab] = useState<"bookmarks" | "visited">("bookmarks");
  const [innerTab, setInnerTab] = useState<"monuments" | "tours">("monuments");

  // Fetch data on mount
  useEffect(() => {
    if (!toursRaw.length) dispatch(fetchTours());
  }, [dispatch, toursRaw.length]);

  // Transform fetched tours into display format
  const allTours: TourItem[] = useMemo(
    () =>
      (toursRaw ?? []).map((t) => ({
        _id: t._id,
        title: t.title,
        description: t.description,
        image: t.image?.secure_url || t.image?.url,
        tourpoints: t.tourpoints ?? [],
      })),
    [toursRaw]
  );

  // Build monuments list from tours
  const allMonuments: MonumentItem[] = useMemo(() => {
    const out: MonumentItem[] = [];
    for (const t of allTours) {
      for (const p of t.tourpoints ?? []) {
        if (isMonumentLike(p)) {
          out.push({ ...p, _tourId: t._id, _tourTitle: t.title });
        }
      }
    }
    return out;
  }, [allTours]);

  // Fake separation just for tab view (could later use bookmarks API)
  const bookmarkedTours = allTours.filter((_, i) => i % 2 === 0);
  const visitedTours = allTours.filter((_, i) => i % 2 === 1);
  const bookmarkedMonuments = allMonuments.filter((_, i) => i % 2 === 0);
  const visitedMonuments = allMonuments.filter((_, i) => i % 2 === 1);

  const dataset =
    topTab === "bookmarks"
      ? innerTab === "monuments"
        ? bookmarkedMonuments
        : bookmarkedTours
      : innerTab === "monuments"
        ? visitedMonuments
        : visitedTours;

  const currentCounts = useMemo(() => {
    const monCount =
      topTab === "bookmarks" ? bookmarkedMonuments.length : visitedMonuments.length;
    const tourCount =
      topTab === "bookmarks" ? bookmarkedTours.length : visitedTours.length;
    return { total: monCount + tourCount, mon: monCount, tou: tourCount };
  }, [topTab, bookmarkedMonuments.length, bookmarkedTours.length, visitedMonuments.length, visitedTours.length]);

  const hasData = dataset.length > 0;

  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        <div className="pointer-events-none absolute -top-20 -right-8 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-400 opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 opacity-60 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/60 to-white/20 dark:from-transparent dark:via-transparent dark:to-transparent" />

        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" />
                {t("Personal Library") || "Personal Library"}
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {t("Bookmarks & Visited Places") || "Bookmarks & Visited Places"}
              </h1>
              <p className="text-sm text-gray-700 dark:text-white/90">
                {t(
                  "Quickly jump back to saved spots or review places you’ve explored."
                ) || "Quickly jump back to saved spots or review places you’ve explored."}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
              <Chip label="Total" value={currentCounts.total} />
              <Chip label="Monuments" value={currentCounts.mon} />
              <Chip label="Tours" value={currentCounts.tou} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <Tabs value={topTab} onValueChange={(v) => setTopTab(v as typeof topTab)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bookmarks">
            <Bookmark className="mr-2 h-4 w-4" />
            {t("Bookmarks") || "Bookmarks"}
          </TabsTrigger>
          <TabsTrigger value="visited">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t("Visited") || "Visited"}
          </TabsTrigger>
        </TabsList>

        {/* INNER MONUMENTS/TOURS */}
        <TabsContent value="bookmarks">
          <InnerTabs
            value={innerTab}
            onChange={setInnerTab}
            monuments={bookmarkedMonuments}
            tours={bookmarkedTours}
          />
        </TabsContent>

        <TabsContent value="visited">
          <InnerTabs
            value={innerTab}
            onChange={setInnerTab}
            monuments={visitedMonuments}
            tours={visitedTours}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INNER TABS (Monuments / Tours) */
/* -------------------------------------------------------------------------- */
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
  const { t } = useLocale();
  const hasMon = monuments.length > 0;
  const hasTours = tours.length > 0;

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as typeof value)} className="space-y-5">
      <div className="flex justify-center">
        <TabsList className="mx-auto flex w-[440px] max-w-full items-center justify-center overflow-hidden rounded-full bg-muted/70 p-1 shadow-sm ring-1 ring-border">
          <TabsTrigger value="monuments">
            <Landmark className="mr-2 h-4 w-4" />
            {t("Monuments") || "Monuments"}
          </TabsTrigger>
          <TabsTrigger value="tours">
            <Compass className="mr-2 h-4 w-4" />
            {t("Tours") || "Tours"}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="monuments">
        {!hasMon ? (
          <EmptyState
            icon={<Landmark className="h-8 w-8" />}
            title={t("No monuments yet") || "No monuments yet"}
            subtitle={t("Bookmark or visit monuments to see them here.") || "Bookmark or visit monuments to see them here."}
          />
        ) : (
          <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {monuments.map((m) => (
              <MonumentCard key={`${m._tourId}:${m._id}`} m={m} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="tours">
        {!hasTours ? (
          <EmptyState
            icon={<Compass className="h-8 w-8" />}
            title={t("No tours yet") || "No tours yet"}
            subtitle={t("Bookmark or complete tours to see them here.") || "Bookmark or complete tours to see them here."}
          />
        ) : (
          <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {tours.map((t) => (
              <TourCard key={t._id} t={t} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

/* -------------------------------------------------------------------------- */
/* CARDS */
/* -------------------------------------------------------------------------- */

function MonumentCard({ m }: { m: MonumentItem }) {
  const { t } = useLocale();
  return (
    <Card className="group overflow-hidden rounded-[22px] border shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="relative h-44 w-full overflow-hidden rounded-t-[22px]">
        {m.image ? (
          <img src={m.image} alt={m.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-xs text-gray-900 shadow">
          <Landmark className="h-3.5 w-3.5" />
          {t("Monument") || "Monument"}
        </div>
      </div>
      <CardHeader className="px-4 pt-3">
        <h3 className="line-clamp-1 text-base font-semibold">{m.name}</h3>
        <p className="text-xs text-muted-foreground">
          {t("From tour:") || "From tour:"} <span className="font-medium text-foreground">{m._tourTitle}</span>
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="secondary" className="rounded-full">
            <Link href={`/tours/detail?id=${encodeURIComponent(m._tourId)}`}>{t("Details") || "Details"}</Link>
          </Button>
          <Button asChild className="rounded-full text-white" style={{ background: "linear-gradient(90deg,#3b82f6 0%,#06b6d4 100%)" }}>
            <Link href={`/tours/detail/navigation?id=${encodeURIComponent(m._tourId)}`}>
              <Navigation className="mr-1 h-4 w-4" />
              {t("Navigate") || "Navigate"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TourCard({ t }: { t: TourItem }) {
  const { t: tr } = useLocale();
  const stops = t.tourpoints?.length ?? 0;
  return (
    <Card className="group overflow-hidden rounded-[22px] border shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="relative h-44 w-full overflow-hidden rounded-t-[22px]">
        {t.image ? (
          <img src={t.image} alt={t.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-xs text-gray-900 shadow">
          <MapPin className="h-3.5 w-3.5" />
          {stops} {stops === 1 ? tr("stop") || "stop" : tr("stops") || "stops"}
        </div>
      </div>
      <CardHeader className="px-4 pt-3">
        <h3 className="line-clamp-1 text-base font-semibold">{t.title}</h3>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {t.description && <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Button asChild variant="secondary" className="rounded-full">
            <Link href={`/tours/detail?id=${encodeURIComponent(t._id)}`}>{tr("Details") || "Details"}</Link>
          </Button>
          <Button asChild className="rounded-full text-white" style={{ background: "linear-gradient(90deg,#3b82f6 0%,#06b6d4 100%)" }}>
            <Link href={`/tours/detail/navigation?id=${encodeURIComponent(t._id)}`}>
              <Navigation className="mr-1 h-4 w-4" />
              {tr("Navigate") || "Navigate"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* UTILITY BITS */
/* -------------------------------------------------------------------------- */

function Chip({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-900 shadow">
      {label}
      <span className="rounded bg-black/5 px-1.5 text-[10px] font-semibold">{value}</span>
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
  const { t } = useLocale();
  return (
    <div className="grid place-items-center rounded-xl border p-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 max-w-md text-xs text-muted-foreground">{subtitle}</div>
      <div className="mt-4">
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/tours">{t("Browse tours") || "Browse tours"}</Link>
        </Button>
      </div>
    </div>
  );
}
