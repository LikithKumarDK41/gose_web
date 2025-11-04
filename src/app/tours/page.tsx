"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  ImageIcon,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
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

import { useAppSelector, useAppDispatch } from "@/lib/store/hook";
import { fetchTours, selectTours } from "@/lib/store/slices/touristSlice";
import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";

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
  const dispatch = useAppDispatch();
  const tours = useAppSelector(selectTours);
  const hasTours = (tours?.length ?? 0) > 0;
  const { show, hide } = useGlobalLoader();

  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [perPage, setPerPage] = useState(6);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [query, perPage]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        show();
        await dispatch(fetchTours());
      } finally {
        if (mounted) hide();
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [dispatch, show, hide]);

  /* ---------- Search + Sort ---------- */
  const filtered = useMemo(() => {
    let arr = [...(tours ?? [])];

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

  /* =========================================================
     💠 Render
  ========================================================= */
  return (
    <div className="space-y-8">
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
      {hasTours && total > 0 && (
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

          {/* ===== Pagination ===== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              ページ {current} / {totalPages}
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-sky-600 hover:text-sky-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                前へ
              </Button>

              <div className="flex items-center gap-1">
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
                        "cursor-pointer h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium transition-all",
                        n === current
                          ? "bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-md scale-105"
                          : "text-sky-600 hover:bg-sky-50 dark:text-cyan-400 dark:hover:bg-cyan-900/30",
                      ].join(" ")}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-sky-600 hover:text-sky-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current >= totalPages}
              >
                次へ
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
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
      <div className="relative w-64">
        <Input
          placeholder={t("tours.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

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
            A → Z
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSortOrder("desc")}
            className={
              sortOrder === "desc"
                ? "bg-gray-100 dark:bg-gray-900 font-semibold"
                : ""
            }
          >
            Z → A
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
