"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/providers/LocaleProvider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { apiFetchPlaces, PlaceItem } from "@/services/userGlobalservice";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import PlaceDetailModal from "@/components/tour/PlaceDetailModal";

/* =========================================================
   🏞️ Places Page
========================================================= */
export default function PlacesPage() {
  const { t } = useLocale();
  const { show, hide } = useGlobalLoader();

  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;

  // Modal state
  const [open, setOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Filter & Sort state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"az" | "za">("az");

  /* ---------------- Fetch Places ---------------- */
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        show();
        const data = await apiFetchPlaces();
        if (mounted) setPlaces(data);
      } catch (err: any) {
        console.error("Failed to fetch places:", err);
      } finally {
        if (mounted) hide();
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  /* Build category list */
  const categoryList = useMemo(() => {
    const cats = places.map((p) => p.category?.title).filter(Boolean);
    return ["all", ...Array.from(new Set(cats))];
  }, [places]);

  /* ✅ Open place modal */
  const handleOpenPlace = async (id: string) => {
    setModalLoading(true);
    const data = places.find((p) => p._id === id);
    setSelectedPlace(data);
    setOpen(true);
    setModalLoading(false);
  };

  /* Reset page when search or filter changes */
  useEffect(() => setPage(1), [query, selectedCategory]);

  /* Filtering + Sorting */
  const filtered = useMemo(() => {
    let list = [...places];

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.category?.title?.toLowerCase().includes(q)
      );
    }

    // Category Filter
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category?.title === selectedCategory);
    }

    // Sort A–Z / Z–A
    list.sort((a, b) => {
      const t1 = (a.title || a.name || "").toLowerCase();
      const t2 = (b.title || b.name || "").toLowerCase();
      return sortOrder === "az" ? t1.localeCompare(t2) : t2.localeCompare(t1);
    });

    return list;
  }, [places, query, selectedCategory, sortOrder]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentData = filtered.slice((page - 1) * limit, page * limit);

  return (
    <>
      <div className="space-y-10">
        {/* ===== HEADER ===== */}
        <section className="relative w-full mx-auto bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-300 text-white rounded-2xl shadow-xl mt-4 mb-10">
          <div className="max-w-5xl mx-auto py-16 px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
              {t("shortcut.gourmet_products")}
            </h1>
            <p className="text-lg md:text-xl font-medium opacity-90">
              {t("shortcut.gourmet_products_desc")}
            </p>
          </div>
        </section>

        {/* ===== Toolbar ===== */}
        <PlacesToolbar
          query={query}
          setQuery={setQuery}
          categoryList={categoryList}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        {/* ===== Grid ===== */}
        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {currentData.map((p) => (
            <PlaceCard
              key={p._id}
              p={p}
              onOpen={() => handleOpenPlace(p._id)}
            />
          ))}
        </div>

        {/* ===== Pagination ===== */}
        <PageNavigator
          totalPages={totalPages}
          page={page}
          onPageChange={setPage}
          t={t}
        />
      </div>

      {/* ✅ Modal */}
      {selectedPlace && (
        <PlaceDetailModal
          open={open}
          onClose={() => setOpen(false)}
          loading={modalLoading}
          details={selectedPlace}
        />
      )}
    </>
  );
}

/* =========================================================
   📦 Place Card
========================================================= */
function PlaceCard({ p, onOpen }: { p: PlaceItem; onOpen: () => void }) {
  const { t } = useLocale();

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/40 shadow-md hover:shadow-xl transition-all">
      <div className="relative h-48 w-full overflow-hidden">
        {p.image?.secure_url ? (
          <img
            src={p.image.secure_url}
            alt={p.title}
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
          <h3 className="line-clamp-1 text-base font-semibold text-yellow-700 dark:text-yellow-300">
            {p.title || p.name}
          </h3>

          {p.content?.brief && (
            <p
              className="text-xs text-muted-foreground mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: p.content.brief }}
            />
          )}
        </div>

        <Button
          className="cursor-pointer mt-3 bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-300 text-white hover:opacity-90"
          onClick={onOpen}
        >
          {t("tourDetails.viewDetails")}
        </Button>
      </div>
    </div>
  );
}

/* =========================================================
   🔎 Toolbar (Search + Category + Sort)
========================================================= */
function PlacesToolbar({
  query,
  setQuery,
  categoryList,
  selectedCategory,
  setSelectedCategory,
  sortOrder,
  setSortOrder,
}: any) {
  const {t} = useLocale();
  return (
    <div className="flex justify-end items-center mb-6 gap-3">
      {/* 🔍 Search Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-yellow-600 hover:bg-fuchsia-50 dark:hover:bg-slate-800"
          >
            <Search className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-2">
          <DropdownMenuLabel>
            {t("shortcut.tourist_attraction_search")}
          </DropdownMenuLabel>
          <Input
            autoFocus
            placeholder="Search places…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-2"
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 🏷 Category Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-yellow-600 hover:bg-fuchsia-50 dark:hover:bg-slate-800"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{t("filter")}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* All categories */}
          <DropdownMenuItem
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-2 ${
              selectedCategory === "all"
                ? "bg-gray-100 dark:bg-gray-900 font-semibold"
                : ""
            }`}
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span>{t("all")}</span>
          </DropdownMenuItem>

          {/* Category list */}
          {categoryList.slice(1).map((c: string) => (
            <DropdownMenuItem
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`flex items-center gap-2 ${
                selectedCategory === c
                  ? "bg-gray-100 dark:bg-gray-900 font-semibold"
                  : ""
              }`}
            >
            <Filter className="h-4 w-4 text-muted-foreground" />
              <span>{c}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 🔁 Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-yellow-600 hover:bg-fuchsia-50 dark:hover:bg-slate-800"
          >
            <ArrowUpDown className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("sort")}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* A → Z */}
          <DropdownMenuItem
            onClick={() => setSortOrder("az")}
            className={`flex items-center gap-2 ${
              sortOrder === "az"
                ? "bg-gray-100 dark:bg-gray-900 font-semibold"
                : ""
            }`}
          >
            <span>A → Z</span>
          </DropdownMenuItem>

          {/* Z → A */}
          <DropdownMenuItem
            onClick={() => setSortOrder("za")}
            className={`flex items-center gap-2 ${
              sortOrder === "za"
                ? "bg-gray-100 dark:bg-gray-900 font-semibold"
                : ""
            }`}
          >
            <span>Z → A</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* =========================================================
   🧭 Pagination
========================================================= */
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

function PageNavigator({ totalPages, page, onPageChange, t }: any) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <div className="text-xs text-muted-foreground">
        {t("pagination_left", { current: page, total: totalPages })}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-slate-800"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("tours.prev")}
        </Button>
        <div className="hidden sm:flex items-center gap-1">
          {rangeAround(page, totalPages, 2).map((n, i) =>
            n === "…" ? (
              <span
                key={`dots-${i}`}
                className="px-2 text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={`page-${n}-${i}`}
                onClick={() => onPageChange(n)}
                className={`cursor-pointer h-8 min-w-8 rounded-md px-2 text-sm ${
                  n === page
                    ? "bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-300 text-white"
                    : "hover:bg-yellow-50 dark:hover:bg-slate-800 text-yellow-700 dark:text-yellow-300"
                }`}
              >
                {n}
              </button>
            )
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-slate-800"
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
