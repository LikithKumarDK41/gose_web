"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Landmark,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MonumentDetailModal from "@/components/tour/MonumentDetailModal";
import {
  apiFetchAllMonumentsWithQuery,
  apiFetchMonumentDetails,
  apiFetchMonumentSorts,
} from "@/services/userTourService";
import type { Monument, MonumentSort } from "@/services/userTourService";
import { useLocale } from "@/providers/LocaleProvider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { useSelector } from "react-redux";

/* =========================================================
   🏛️ Monuments Page
========================================================= */
export default function FacilityPage() {
  const { t } = useLocale();
  const { show, hide } = useGlobalLoader();
  const activeThemeId = useSelector((state: any) => state.global.activeThemeId);

  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;

  const [open, setOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedMonument, setSelectedMonument] = useState<Monument | null>(
    null
  );

  /* -------------------- Fetch All Monuments -------------------- */
  useEffect(() => {
    let mounted = true;
    const loadMonuments = async () => {
      try {
        show();
        const data = await apiFetchAllMonumentsWithQuery({
          filter: activeThemeId ? { theme: activeThemeId } : undefined,
          sort: selectedSort ?? undefined,
        });
        if (mounted) setMonuments(data);
      } catch (err: any) {
        console.error("Failed to fetch monuments:", err);
        setError(err.message || "Failed to fetch monuments");
      } finally {
        if (mounted) hide();
      }
    };
    loadMonuments();
    return () => {
      mounted = false;
    };
  }, [selectedSort, show, hide]);

  /* -------------------- Filtering -------------------- */
  useEffect(() => setPage(1), [query]);

  const filtered = useMemo(() => {
    if (!query.trim()) return monuments;
    const q = query.toLowerCase();
    return monuments.filter(
      (m) =>
        m.title?.toLowerCase().includes(q) ||
        m.name?.toLowerCase().includes(q) ||
        m.region?.title?.toLowerCase().includes(q)
    );
  }, [monuments, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentData = filtered.slice((page - 1) * limit, page * limit);

  /* -------------------- Detail Modal -------------------- */
  const handleOpenMonument = async (id: string) => {
    setModalLoading(true);
    try {
      const data = await apiFetchMonumentDetails(id);
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
      const data = await apiFetchMonumentDetails(id);
      setSelectedMonument(data);
    } catch (err) {
      console.error("Failed to open another monument:", err);
    } finally {
      setModalLoading(false);
    }
  };

  /* =========================================================
            Render
        ========================================================= */
  if (error)
    return (
      <div className="text-center text-lg text-red-500 mt-10">{error}</div>
    );

  return (
    <div className="space-y-10">
      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full mx-auto bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 text-white rounded-2xl shadow-xl mt-4 mb-10">
        <div className="max-w-5xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
            {t("shortcut.facility")}
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90">
            {t("shortcut.facility_desc")}
          </p>
        </div>
      </section>

      {/* ===== SEARCH + FILTER BAR ===== */}
      <MonumentsToolbar
        query={query}
        setQuery={setQuery}
        onSortSelect={(v) => setSelectedSort(v)}
        selectedSort={selectedSort}
      />

      {/* ===== EMPTY STATE ===== */}
      {filtered.length === 0 && (
        <EmptyState
          icon={<Landmark className="h-8 w-8" />}
          title={t("facility.no_results_title")}
          subtitle={t("facility.no_results_subtitle")}
        />
      )}

      {/* ===== GRID ===== */}
      {filtered.length > 0 && (
        <>
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {currentData.map((m) => (
              <MonumentCard
                key={m._id}
                m={m}
                onOpen={() => handleOpenMonument(m._id)}
              />
            ))}
          </div>
          <PageNavigator
            totalPages={totalPages}
            page={page}
            onPageChange={setPage}
            t={t}
          />
        </>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {selectedMonument && (
        <MonumentDetailModal
          open={open}
          onClose={() => setOpen(false)}
          loading={modalLoading}
          details={selectedMonument}
          onOpenAnother={handleOpenAnother}
        />
      )}
    </div>
  );
}

/* =========================================================
   📦 Monument Card
========================================================= */
function MonumentCard({ m, onOpen }: { m: Monument; onOpen: () => void }) {
  const { t } = useLocale();
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/40 shadow-md hover:shadow-xl transition-all">
      <div className="relative h-48 w-full overflow-hidden">
        {m.image?.secure_url ? (
          <img
            src={m.image.secure_url}
            alt={m.title || m.name}
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
          <h3 className="line-clamp-1 text-base font-semibold text-blue-700 dark:text-blue-300">
            {m.title || m.name}
          </h3>
          {m.content?.brief && (
            <p
              className="text-xs text-muted-foreground mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: m.content.brief }}
            />
          )}
        </div>
        <Button
          className="cursor-pointer mt-3 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 text-white hover:opacity-90"
          onClick={onOpen}
        >
          {t("tourDetails.viewDetails")}
        </Button>
      </div>
    </div>
  );
}

/* =========================================================
   🧭 Pagination
========================================================= */
function PageNavigator({ totalPages, page, onPageChange, t }: any) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <div className="text-xs text-muted-foreground">
        {t("pagination_left", { current: page, total: totalPages })}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
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
                    ? "bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 text-white"
                    : "hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-300"
                }`}
              >
                {n}
              </button>
            )
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
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

/* =========================================================
   🪶 Empty State
========================================================= */
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
    <div className="grid place-items-center rounded-3xl bg-gradient-to-br from-white/60 to-pink-50/40 dark:from-gray-900/50 dark:to-gray-800/50 p-10 text-center shadow-inner">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 text-white shadow">
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

/* =========================================================
   🔎 Toolbar (Search + Filter + Sort)
========================================================= */
function MonumentsToolbar({
  query,
  setQuery,
  onSortSelect,
  selectedSort,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSortSelect: (v: string) => void;
  selectedSort?: string | null;
}) {
  const { t } = useLocale();
  const [sortOptions, setSortOptions] = useState<MonumentSort[]>([]);
  const [loadingSorts, setLoadingSorts] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadSorts = async () => {
      try {
        setLoadingSorts(true);
        const data = await apiFetchMonumentSorts();
        if (mounted) {
          const sorted = data.sort(
            (a, b) => (a.priority ?? 99) - (b.priority ?? 99)
          );
          setSortOptions(sorted);
          if (sorted.length > 0) {
            onSortSelect(sorted[0].link || sorted[0].name || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch monument sorts:", err);
      } finally {
        setLoadingSorts(false);
      }
    };
    loadSorts();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex justify-end items-center gap-2 mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
          >
            <Search className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2">
          <DropdownMenuLabel>
            {t("shortcut.tourist_attraction_search")}
          </DropdownMenuLabel>
          <Input
            autoFocus
            placeholder={t("shortcut.tourist_attraction_search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-2"
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("sort")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loadingSorts ? (
            <DropdownMenuItem disabled>{t("loading")}</DropdownMenuItem>
          ) : sortOptions.length > 0 ? (
            sortOptions.map((s) => (
              <DropdownMenuItem
                key={s._id}
                onClick={() => onSortSelect(s.link || s.name || "")}
                className={`text-black dark:text-white  flex items-center gap-2 ${
                  selectedSort == s.link
                    ? "bg-gray-100 dark:bg-gray-900 font-semibold"
                    : ""
                }`}
              >
                {s.icon?.secure_url ? (
                  <img
                    src={s.icon.secure_url}
                    alt={s.title || s.name}
                    className="h-4 w-4 rounded-sm object-contain"
                  />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{s.title || s.name}</span>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>{t("facility.no_sort_options")}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
