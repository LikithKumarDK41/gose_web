"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Landmark,
  Bookmark,
  CheckCircle2,
  Compass,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocale } from "@/providers/LocaleProvider";
import type { AppDispatch } from "@/lib/store";
import { fetchMonumentDetails } from "@/lib/store/slices/touristSlice";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MonumentDetailModal from "@/components/tour/MonumentDetailModal";
import {
  apiGetUserBookmarks,
  apiGetVisitHistoryByUser,
  apiDeleteBookmark,
  apiDeleteVisitHistory,
} from "@/services/myListService";
import { apiDeleteUserTour } from "@/services/userTourService";

/* MAIN PAGE */
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

  const [page, setPage] = useState({
    bookmarkedMonuments: 1,
    bookmarkedTours: 1,
    visitedMonuments: 1,
    visitedTours: 1,
  });

  const limit = 6;

  const [open, setOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedMonument, setSelectedMonument] = useState<any | null>(null);

  /* ============================
        FETCH BOOKMARKS
     ============================ */
  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const res = await apiGetUserBookmarks();

      const monuments = (res.monuments || []).map((m: any) => ({
        bookmarkId: m._id,
        marktype: "monument",
        monument: m.monument,
      }));

      const tours = (res.tours || []).map((t: any) => ({
        bookmarkId: t._id,
        marktype: "tour",
        tour: t.tour,
      }));

      setBookmarks([...monuments, ...tours]);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  /* ============================
        FETCH VISIT HISTORY
     ============================ */
  const loadVisits = async () => {
    try {
      const res = await apiGetVisitHistoryByUser();

      const combined = [
        ...(res.monuments || []).map((m: any) => ({
          visitId: m._id,
          historytype: "monument",
          monument: m.monument,
        })),
        ...(res.tours || []).map((t: any) => ({
          visitId: t._id,
          historytype: "tour",
          tour: t.tour,
        })),
      ];

      setVisits(combined);
    } catch (err) {
      console.error("Failed to fetch visit histories:", err);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  /* ============================
        DATA FORMATTERS
     ============================ */
  const cleanText = (html: string) =>
    (html || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const bookmarkedMonuments = useMemo(
    () =>
      bookmarks
        .filter((b) => b.marktype === "monument" && b.monument)
        .map((b) => ({
          bookmarkId: b.bookmarkId,
          _id: b.monument._id,
          name: b.monument.title,
          image: b.monument.image?.secure_url || b.monument.image?.url,
          description: cleanText(b.monument.content?.brief || ""),
        })),
    [bookmarks]
  );

  const bookmarkedTours = useMemo(
    () =>
      bookmarks
        .filter((b) => b.marktype === "tour" && b.tour)
        .map((b) => ({
          bookmarkId: b.bookmarkId,
          _id: b.tour._id,
          title: b.tour.title,
          image: b.tour.image?.secure_url || b.tour.image?.url,
          description: cleanText(b.tour.content?.brief || ""),
        })),
    [bookmarks]
  );

  const visitedMonuments = useMemo(
    () =>
      visits
        .filter((v) => v.historytype === "monument" && v.monument)
        .map((v) => ({
          visitId: v.visitId,
          _id: v.monument._id,
          name: v.monument.title,
          image: v.monument.image?.secure_url || v.monument.image?.url,
          description: cleanText(v.monument.content?.brief || ""),
        })),
    [visits]
  );

  const visitedTours = useMemo(
    () =>
      visits
        .filter((v) => v.historytype === "tour" && v.tour)
        .map((v) => ({
          visitId: v.visitId,
          _id: v.tour._id,
          title: v.tour.title,
          image: v.tour.image?.secure_url || v.tour.image?.url,
          description: cleanText(v.tour.content?.brief || ""),
        })),
    [visits]
  );

  /* ============================
        DELETE HANDLERS
     ============================ */
  const deleteBookmark = async (bookmarkId: string) => {
    await apiDeleteBookmark(bookmarkId);
    loadBookmarks(); // refresh
  };

  const deleteVisit = async (visitId: string) => {
    await apiDeleteVisitHistory(visitId);
    loadVisits(); // refresh
  };

  /* ============================
        PAGINATION
     ============================ */
  const getPageKey = () => {
    if (topTab === "bookmarks" && innerTab === "monuments")
      return "bookmarkedMonuments";
    if (topTab === "bookmarks" && innerTab === "tours")
      return "bookmarkedTours";
    if (topTab === "visited" && innerTab === "monuments")
      return "visitedMonuments";
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

  const currentData = dataList.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  /* ============================
        MONUMENT DETAILS
     ============================ */
  const handleOpenMonument = async (id: string) => {
    setModalLoading(true);
    try {
      const thunk = dispatch(fetchMonumentDetails(id));
      const data = await thunk.unwrap();
      setSelectedMonument(data);
      setOpen(true);
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

  const refreshAll = async () => {
    try {
      const b = await apiGetUserBookmarks();
      const v = await apiGetVisitHistoryByUser();

      const monumentBookmarks = (b.monuments || []).map((m: any) => ({
        bookmarkId: m._id,     // keep bookmark id
        marktype: "monument",
        monument: m.monument,
      }));

      const tourBookmarks = (b.tours || []).map((t: any) => ({
        bookmarkId: t._id,
        marktype: "tour",
        tour: t.tour,
      }));

      setBookmarks([...monumentBookmarks, ...tourBookmarks]);

      const combinedVisits = [
        ...(v.monuments || []).map((m: any) => ({
          visitId: m._id,
          historytype: "monument",
          monument: m.monument,
        })),
        ...(v.tours || []).map((t: any) => ({
          visitId: t._id,
          historytype: "tour",
          tour: t.tour,
        })),
      ];

      setVisits(combinedVisits);
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  };

  const deleteUserTour = async (visitId: string) => {
    await apiDeleteUserTour(visitId);
    loadVisits(); // refresh only visit history list
  };

  return (
    <div className="t-8">
      {/* HERO BANNER */}
      <section className="relative w-full mx-auto bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white rounded-2xl shadow-xl mt-4 mb-10">
        <div className="max-w-5xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
            {t("personal_library")}
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            {t("personal_library_subtitle")}
          </p>
        </div>
      </section>

      {/* MAIN TABS */}
      <Tabs
        value={topTab}
        onValueChange={(v) => setTopTab(v as any)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/70 p-1 shadow ring-1 ring-border">
          <TabsTrigger value="bookmarks" className="cursor-pointer">
            <Bookmark className="mr-2 h-4 w-4" /> {t("Bookmarks")}
          </TabsTrigger>
          <TabsTrigger value="visited" className="cursor-pointer">
            <CheckCircle2 className="mr-2 h-4 w-4" /> {t("Visited")}
          </TabsTrigger>
        </TabsList>

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
            onDeleteBookmark={deleteBookmark}
            onDeleteVisit={deleteVisit}
            onDeleteUserTour={deleteUserTour}
            isBookmarkTab={topTab === "bookmarks"}
          />
        </TabsContent>
      </Tabs>

      {selectedMonument && (
        <MonumentDetailModal
          open={open}
          onClose={async () => {
            setOpen(false);
            await refreshAll();   // 🔥 reload list on modal close
          }}
          loading={modalLoading || loadingState}
          details={selectedMonument}
          onOpenAnother={handleOpenAnother}
        />
      )}
    </div>
  );
}

/* ============================================
        INNER TAB CONTENT (CARDS)
   ============================================ */
function InnerTabs({
  value,
  onChange,
  data,
  totalPages,
  page,
  onPageChange,
  t,
  onOpenMonument,
  onDeleteBookmark,
  onDeleteVisit,
  isBookmarkTab,
  onDeleteUserTour
}: any) {
  const hasData = data.length > 0;
  const isMonument = value === "monuments";

  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        onChange(v as any);
        onPageChange(1);
      }}
      className="space-y-6"
    >
      <div className="flex justify-center">
        <TabsList className="mx-auto flex w-[420px] max-w-full items-center justify-center rounded-full bg-muted/50 p-1 shadow ring-1 ring-border">
          <TabsTrigger value="monuments" className="cursor-pointer">
            <Landmark className="mr-2 h-4 w-4" /> {t("Monuments")}
          </TabsTrigger>
          <TabsTrigger value="tours" className="cursor-pointer">
            <Compass className="mr-2 h-4 w-4" /> {t("Tours")}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value={value}>
        {!hasData ? (
          <EmptyState
            icon={
              isMonument ? (
                <Landmark className="h-8 w-8" />
              ) : (
                <Compass className="h-8 w-8" />
              )
            }
            title={isMonument ? t("no_monuments_found") : t("no_tours_found")}
            subtitle={
              isMonument
                ? t("bookmark_or_visit_monuments_to_see_them_here")
                : t("bookmark_or_visit_tours_to_see_them_here")
            }
          />
        ) : (
          <>
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {data.map((item: any, idx: number) =>
                isMonument ? (
                  <MonumentCard
                    key={`mon-${item._id}-${idx}`}
                    m={item}
                    onOpen={onOpenMonument}
                    onDeleteBookmark={onDeleteBookmark}
                    onDeleteVisit={onDeleteVisit}
                    isBookmarkTab={isBookmarkTab}
                  />
                ) : (
                  <TourCard
                    key={`tour-${item._id}-${idx}`}
                    t={item}
                    onDeleteBookmark={onDeleteBookmark}
                    onDeleteVisit={onDeleteVisit}
                    isBookmarkTab={isBookmarkTab}
                    onDeleteUserTour={onDeleteUserTour}
                  />
                )
              )}
            </div>

            <PageNavigator
              totalPages={totalPages}
              page={page}
              onPageChange={onPageChange}
              t={t}
            />
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

/* ============================================
        MONUMENT CARD WITH DELETE ICON
   ============================================ */
function MonumentCard({
  m,
  onOpen,
  onDeleteBookmark,
  onDeleteVisit,
  isBookmarkTab,
}: any) {
  const { t } = useLocale();

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/40 shadow-md hover:shadow-xl border">
      {/* DELETE BUTTON */}
      <button
        className="cursor-pointer absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600 z-20"
        onClick={() =>
          isBookmarkTab
            ? onDeleteBookmark(m.bookmarkId)
            : onDeleteVisit(m.visitId)
        }
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* IMAGE */}
      <div className="relative h-48 w-full overflow-hidden">
        {m.image ? (
          <img
            src={m.image}
            alt={m.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-sky-700 dark:text-cyan-300">
            {m.name}
          </h3>
          {m.description && (
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
              {m.description}
            </p>
          )}
        </div>

        <Button
          className="cursor-pointer mt-3 h-9 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white hover:opacity-90"
          onClick={() => onOpen(m._id)}
        >
          {t("Details")}
        </Button>
      </div>
    </div>
  );
}

/* ============================================
        TOUR CARD WITH DELETE ICON
   ============================================ */
function TourCard({
  t: tour,
  onDeleteBookmark,
  onDeleteVisit,
  isBookmarkTab,
  onDeleteUserTour
}: any) {
  const { t: tr } = useLocale();

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/40 shadow-md hover:shadow-xl border">
      {/* DELETE BUTTON */}
      <button
        className="cursor-pointer absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600 z-20"
        onClick={() => {
          if (isBookmarkTab) {
            onDeleteBookmark(tour.bookmarkId);
          } else {
            onDeleteUserTour(tour.visitId);   // ✅ FIXED
          }
        }}

      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="relative h-48 w-full overflow-hidden">
        {tour.image ? (
          <img
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-sky-700 dark:text-cyan-300">
            {tour.title}
          </h3>
          {tour.description && (
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
              {tour.description}
            </p>
          )}
        </div>

        <Button
          asChild
          className="cursor-pointer h-9 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white hover:opacity-90"
        >
          <Link href={`/tours/detail?id=${encodeURIComponent(tour._id)}`}>
            {tr("Details")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ============================================
        PAGINATION
   ============================================ */
function PageNavigator({ totalPages, page, onPageChange, t }: any) {
  return (
    <div className="flex items-center justify-between pt-4">
      <div className="text-xs text-muted-foreground">
        {t("pagination_left", { current: page, total: totalPages })}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("tours.prev")}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          {t("tours.next")}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: any) {
  return (
    <div className="grid place-items-center rounded-3xl border bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-gray-900/50 dark:to-gray-800/50 p-10 text-center shadow-inner">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white shadow">
        {icon}
      </div>
      <div className="text-base font-semibold text-gray-800 dark:text-white">
        {title}
      </div>
      <div className="mt-1 max-w-md text-xs text-gray-600 dark:text-gray-400">
        {subtitle}
      </div>
    </div>
  );
}
