"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  ImageIcon,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { apiFetchTours } from "@/services/userTourService";
import type { Tour } from "@/services/userTourService";

/* =========================================================
   🧹 Safe HTML Sanitizer
========================================================= */
function sanitizeHTML(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

/* =========================================================
   🗺️ Tours Page
========================================================= */
export default function ToursPage() {
  const { t } = useLocale();
  const { show, hide } = useGlobalLoader();

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [perPage, setPerPage] = useState(6);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [query, perPage]);

  /* -------------------- Fetch Tours -------------------- */
  useEffect(() => {
    let mounted = true;
    const fetchToursData = async () => {
      try {
        show();
        const data = await apiFetchTours();
        if (mounted) setTours(data);
      } catch (err) {
        console.error("Failed to fetch tours:", err);
      } finally {
        if (mounted) {
          hide();
          setLoading(false);
        }
      }
    };
    fetchToursData();
    return () => {
      mounted = false;
    };
  }, [show, hide]);

  /* -------------------- Search + Sort -------------------- */
  const filtered = useMemo(() => {
    let arr = [...tours];
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }

    arr.sort((a, b) =>
      sortOrder === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    );

    return arr;
  }, [tours, query, sortOrder]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, totalPages);
  const startIdx = (current - 1) * perPage;
  const pageItems = filtered.slice(startIdx, startIdx + perPage);

  const hasTours = tours.length > 0;

  /* =========================================================
     💠 Render
  ========================================================= */
  return (
    <div className="t-8">
      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full mx-auto bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white rounded-2xl shadow-xl mt-4 mb-10">
        <div className="max-w-5xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
            {t("tours.exploreTours")}
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90">
            {t("tours.liveTours")}
          </p>
        </div>
      </section>

      {/* ===== Toolbar (Search + Sort) ===== */}
      <ToursToolbar
        query={query}
        setQuery={setQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* ===== Tours Grid ===== */}
      {!loading && hasTours && total > 0 && (
        <>
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((tour) => (
              <div
                key={tour._id}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/40 shadow-md hover:shadow-xl transition-all border"
              >
                {/* ===== Image Section ===== */}
                <div className="relative h-48 w-full overflow-hidden">
                  {tour.image?.secure_url ? (
                    <img
                      src={tour.image.secure_url}
                      alt={tour.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* ===== Content Section ===== */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="line-clamp-1 text-base font-semibold text-sky-700 dark:text-cyan-300">
                      {tour.title}
                    </h3>
                    {tour.content?.brief && (
                      <p
                        className="text-xs text-muted-foreground mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHTML(tour.content.brief),
                        }}
                      />
                    )}
                  </div>

                  <Button
                    onClick={() =>
                      (window.location.href = `/tours/detail?id=${tour._id}`)
                    }
                    className="cursor-pointer mt-3 h-9 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white hover:opacity-90 transition-all"
                  >
                    {t("actions.details")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* ===== Pagination (Component) ===== */}
          <PageNavigator
            totalPages={totalPages}
            page={page}
            onPageChange={setPage}
            t={t}
          />
        </>
      )}

      {!loading && (!hasTours || total === 0) && (
        <div className="rounded-xl border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t("no_tours_available")}
          </p>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔎 Toolbar (Search + Sort)
========================================================= */
function ToursToolbar({
  query,
  setQuery,
  sortOrder,
  setSortOrder,
}: {
  query: string;
  setQuery: (v: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (v: "asc" | "desc") => void;
}) {
  const { t } = useLocale();

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
          placeholder={t("tours.searchPlaceholder")}
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
            className="rounded-full text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{t("sort")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setSortOrder("asc")}
            className={
              sortOrder === "asc"
                ? "bg-gray-100 dark:bg-gray-900 font-semibold"
                : ""
            }
          >
            {t("sort_asc")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSortOrder("desc")}
            className={
              sortOrder === "desc"
                ? "bg-gray-100 dark:bg-gray-900 font-semibold"
                : ""
            }
          >
            {t("sort_desc")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* =========================================================
   🌿 Pagination Component (Sky / Cyan / Emerald Theme)
========================================================= */
function PageNavigator({
  totalPages,
  page,
  onPageChange,
  t,
}: {
  totalPages: number;
  page: number;
  onPageChange: (n: number) => void;
  t: any;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      {/* Left Info */}
      <div className="text-xs text-muted-foreground">
        {t("pagination_left", { current: page, total: totalPages })}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* Prev Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("tours.prev")}
        </Button>

        {/* Page Numbers */}
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
                className={`cursor-pointer h-8 min-w-8 rounded-md px-2 text-sm ${n === page
                  ? "bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-sm"
                  : "hover:bg-sky-50 dark:hover:bg-slate-800 text-sky-700 dark:text-cyan-300"
                  }`}
              >
                {n}
              </button>
            )
          )}
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800"
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

/* =========================================================
   📎 Helpers
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
