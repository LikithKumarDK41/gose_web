"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Landmark,
  Bookmark,
  CheckCircle2,
  Compass,
  ImageIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/providers/LocaleProvider";
import { apiGetBookmarks, apiGetVisitHistories } from "@/services/myListService";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/lib/store";
import { fetchMonumentDetails } from "@/lib/store/slices/touristSlice";
import MonumentDetailModal from "@/components/tour/MonumentDetailModal";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */
type MonumentItem = {
  _id: string;
  name?: string;
  image?: string;
  tourTitle?: string;
  description?: string;
};

type TourItem = {
  _id: string;
  title?: string;
  description?: string;
  image?: string;
  tourpoints?: any[];
};

/* -------------------------------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------------------------------- */
export default function LibraryPage() {
  const { t } = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const monumentDetail = useSelector((s: any) => s.tourist.monumentDetail);
  const loadingState = useSelector((s: any) => s.tourist.loading);

  const [topTab, setTopTab] = useState<"bookmarks" | "visited">("bookmarks");
  const [innerTab, setInnerTab] = useState<"monuments" | "tours">("monuments");

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Separate pagination states for each combination
  const [page, setPage] = useState({
    bookmarkedMonuments: 1,
    bookmarkedTours: 1,
    visitedMonuments: 1,
    visitedTours: 1,
  });

  const limit = 6;

  /* -------------------- Modal States -------------------- */
  const [open, setOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedMonument, setSelectedMonument] = useState<any | null>(null);

  /* -------------------- Fetch Bookmarks -------------------- */
  useEffect(() => {
    const loadBookmarks = async () => {
      setLoading(true);
      try {
        const res = await apiGetBookmarks();
        setBookmarks(res.bookmarks.results || []);
      } catch (err) {
        console.error("Failed to fetch bookmarks:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBookmarks();
  }, []);

  /* -------------------- Fetch Visit Histories -------------------- */
  useEffect(() => {
    const loadVisits = async () => {
      try {
        const res = await apiGetVisitHistories();
        setVisits(res.visithistories.results || []);
      } catch (err) {
        console.error("Failed to fetch visit histories:", err);
      }
    };
    loadVisits();
  }, []);

  /* -------------------- Mapped Data -------------------- */
  const bookmarkedMonuments = useMemo(
    () =>
      bookmarks
        .filter((b) => b.marktype === "monument" && b.monument)
        .map((b) => ({
          _id: b.monument._id,
          name: b.monument.title,
          image: b.monument.image?.secure_url || b.monument.image?.url,
          tourTitle: b.tour?.title,
          description:
            b.monument.content?.brief || b.monument.content?.extended || "",
        })),
    [bookmarks]
  );

  const bookmarkedTours = useMemo(
    () =>
      bookmarks
        .filter((b) => b.marktype === "tour" && b.tour)
        .map((b) => ({
          _id: b.tour._id,
          title: b.tour.title,
          description: b.tour.content?.brief,
          image: b.tour.image?.secure_url || b.tour.image?.url,
          tourpoints: b.tour.monuments ?? [],
        })),
    [bookmarks]
  );

  const visitedMonuments = useMemo(
    () =>
      visits
        .filter((v) => v.historytype === "monument" && v.monument)
        .map((v) => ({
          _id: v.monument._id,
          name: v.monument.title,
          image: v.monument.image?.secure_url || v.monument.image?.url,
          description:
            v.monument.content?.brief || v.monument.content?.extended || "",
        })),
    [visits]
  );

  const visitedTours = useMemo(
    () =>
      visits
        .filter((v) => v.historytype === "tour" && v.tour)
        .map((v) => ({
          _id: v.tour._id,
          title: v.tour.title,
          description: v.tour.content?.brief,
          image: v.tour.image?.secure_url || v.tour.image?.url,
          tourpoints: v.tour.monuments ?? [],
        })),
    [visits]
  );

  /* -------------------- Pagination Helpers -------------------- */
  const getPageKey = () => {
    if (topTab === "bookmarks" && innerTab === "monuments") return "bookmarkedMonuments";
    if (topTab === "bookmarks" && innerTab === "tours") return "bookmarkedTours";
    if (topTab === "visited" && innerTab === "monuments") return "visitedMonuments";
    return "visitedTours";
  };

  const handlePageChange = (p: number) => {
    const key = getPageKey();
    setPage((prev) => ({ ...prev, [key]: p }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentPage = page[getPageKey()];
  const dataList =
    topTab === "bookmarks"
      ? innerTab === "monuments"
        ? bookmarkedMonuments
        : bookmarkedTours
      : innerTab === "monuments"
        ? visitedMonuments
        : visitedTours;

  const totalPages = Math.ceil(dataList.length / limit) || 1;
  const currentData = dataList.slice((currentPage - 1) * limit, currentPage * limit);

  /* -------------------- Handle Monument Detail -------------------- */
  const handleOpenMonument = async (id: string) => {
    setModalLoading(true);
    try {
      const thunk = dispatch(fetchMonumentDetails(id));
      const data = await thunk.unwrap();
      setSelectedMonument(data);
      setOpen(true);
    } catch (err) {
      console.error("Failed to fetch monument details:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenAnother = async (id: string) => {
    setModalLoading(true);
    try {
      const thunk = dispatch(fetchMonumentDetails(id));
      const data = await thunk.unwrap();
      setSelectedMonument(data);
    } catch (err) {
      console.error("Failed to open another monument:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const details =
    selectedMonument && monumentDetail?._id === selectedMonument._id
      ? monumentDetail
      : selectedMonument;

  /* -------------------------------------------------------------------------- */
  return (
    <div className="space-y-10">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        <div className="pointer-events-none absolute -top-20 -right-8 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-400 opacity-60 blur-3xl dark:opacity-40" />
        <div className="relative p-6 sm:p-7 text-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white shadow ring-1 ring-white/10 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {t("Personal Library")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mt-3">
            {t("Bookmarks & Visited Places")}
          </h1>
        </div>
      </div>

      {/* ===== MAIN TABS ===== */}
      <Tabs
        value={topTab}
        onValueChange={(v) => setTopTab(v as typeof topTab)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/70 p-1 shadow ring-1 ring-border">
          <TabsTrigger value="bookmarks">
            <Bookmark className="mr-2 h-4 w-4" />
            {t("Bookmarks")}
          </TabsTrigger>
          <TabsTrigger value="visited">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t("Visited")}
          </TabsTrigger>
        </TabsList>

        {/* CONTENT */}
        <TabsContent value={topTab}>
          <InnerTabs
            key={`${topTab}-${innerTab}`}
            value={innerTab}
            onChange={setInnerTab}
            data={currentData}
            totalPages={totalPages}
            page={currentPage}
            onPageChange={handlePageChange}
            t={t}
            onOpenMonument={handleOpenMonument}
            topTab={topTab}
          />
        </TabsContent>
      </Tabs>

      {/* Monument Detail Modal */}
      {details && (
        <MonumentDetailModal
          open={open}
          onClose={() => setOpen(false)}
          loading={modalLoading || loadingState}
          details={details}
          onOpenAnother={handleOpenAnother}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INNER TABS */
/* -------------------------------------------------------------------------- */
function InnerTabs({ value, onChange, data, totalPages, page, onPageChange, t, onOpenMonument, topTab }: any) {
  const hasData = data.length > 0;
  const isMonument = value === "monuments";

  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        onChange(v as typeof value);
        onPageChange(1);
      }}
      className="space-y-6"
    >
      <div className="flex justify-center">
        <TabsList className="mx-auto flex w-[420px] max-w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-100 via-white to-indigo-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 shadow ring-1 ring-border p-1">
          <TabsTrigger value="monuments">
            <Landmark className="mr-2 h-4 w-4" />
            {t("Monuments")}
          </TabsTrigger>
          <TabsTrigger value="tours">
            <Compass className="mr-2 h-4 w-4" />
            {t("Tours")}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value={value}>
        {!hasData ? (
          <EmptyState
            icon={isMonument ? <Landmark className="h-8 w-8" /> : <Compass className="h-8 w-8" />}
            title={isMonument ? t("No monuments found") : t("No tours found")}
            subtitle={
              isMonument
                ? t("Bookmark or visit some monuments to see them here.")
                : t("Bookmark or visit some tours to see them here.")
            }
          />
        ) : (
          <>
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {data.map((item: any, idx: number) =>
                isMonument ? (
                  <MonumentCard key={`mon-${item._id}-${idx}`} m={item} onOpen={onOpenMonument} />
                ) : (
                  <TourCard key={`tour-${item._id}-${idx}`} t={item} />
                )
              )}
            </div>
            <PageNavigator totalPages={totalPages} page={page} onPageChange={onPageChange} t={t} />
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

/* -------------------------------------------------------------------------- */
/* CARD COMPONENTS */
/* -------------------------------------------------------------------------- */
function MonumentCard({ m, onOpen }: { m: MonumentItem; onOpen: (id: string) => void }) {
  const { t } = useLocale();
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm">
      <div className="relative h-48 w-full overflow-hidden">
        {m.image ? (
          <img src={m.image} alt={m.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold">{m.name}</h3>
          {m.tourTitle && <p className="text-xs text-muted-foreground mt-1">{t("From tour")}: {m.tourTitle}</p>}
        </div>
        <Button variant="secondary" className="mt-3" onClick={() => onOpen(m._id)}>
          {t("Details")}
        </Button>
      </div>
    </div>
  );
}

function TourCard({ t }: { t: TourItem }) {
  const { t: tr } = useLocale();
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm">
      <div className="relative h-48 w-full overflow-hidden">
        {t.image ? (
          <img src={t.image} alt={t.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
        <h3 className="line-clamp-1 text-base font-semibold">{t.title}</h3>
        <Button asChild variant="secondary">
          <Link href={`/tours/detail?id=${encodeURIComponent(t._id)}`}>{tr("Details")}</Link>
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGINATION HELPERS */
/* -------------------------------------------------------------------------- */
function PageNavigator({ totalPages, page, onPageChange, t }: any) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <div className="text-xs text-muted-foreground">
        {t("Page {{current}} of {{total}}", { current: page, total: totalPages })}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("Prev")}
        </Button>
        <div className="hidden sm:flex items-center gap-1">
          {rangeAround(page, totalPages, 2).map((n, i) =>
            n === "…" ? (
              <span key={`dots-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
            ) : (
              <button
                key={`page-${n}-${i}`}
                onClick={() => onPageChange(n)}
                className={[
                  "cursor-pointer h-8 min-w-8 rounded-md px-2 text-sm",
                  n === page ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                ].join(" ")}
              >
                {n}
              </button>
            )
          )}
        </div>
        <Button variant="outline" size="sm" className="h-8" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
          {t("Next")}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function rangeAround(current: number, total: number, radius: number): (number | "…")[] {
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

/* -------------------------------------------------------------------------- */
/* EMPTY STATE */
/* -------------------------------------------------------------------------- */
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid place-items-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/60 to-indigo-50/40 dark:from-gray-900/50 dark:to-gray-800/50 p-10 text-center shadow-inner">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground shadow">
        {icon}
      </div>
      <div className="text-base font-semibold text-gray-800 dark:text-white">{title}</div>
      <div className="mt-1 max-w-md text-xs text-gray-600 dark:text-gray-400">{subtitle}</div>
    </div>
  );
}
