"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Filter,
  ArrowUpDown,
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

/* =========================================================
   🏞️ Places Page (Same UI as Monuments)
========================================================= */
export default function PlacesPage() {
  const { t } = useLocale();

  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;

  /* ---------------- Fetch Places ---------------- */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await apiFetchPlaces();
      setPlaces(data);
      setLoading(false);
    }
    load();
  }, []);

  /* Search Reset Page */
  useEffect(() => setPage(1), [query]);

  /* Filtering */
  const filtered = useMemo(() => {
    if (!query.trim()) return places;
    const q = query.toLowerCase();
    return places.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.title?.toLowerCase().includes(q)
    );
  }, [places, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentData = filtered.slice((page - 1) * limit, page * limit);

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="space-y-10">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden rounded-2xl border">
        <div className="pointer-events-none absolute -top-20 -right-8 h-72 w-72 rounded-full bg-gradient-to-tr from-green-400 via-teal-400 to-blue-400 opacity-60 blur-3xl dark:opacity-40" />
        <div className="relative p-6 sm:p-7 text-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white shadow ring-1 ring-white/10 backdrop-blur">
            <Landmark className="h-3.5 w-3.5" />
            {t("Places")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mt-3">
            {t("Explore Places in Gose")}
          </h1>
        </div>
      </div>

      {/* ===== Toolbar ===== */}
      <PlacesToolbar query={query} setQuery={setQuery} />

      {/* ===== Grid ===== */}
      <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
        {currentData.map((p) => (
          <PlaceCard key={p._id} p={p} />
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
  );
}

/* =========================================================
   📦 Place Card
========================================================= */
function PlaceCard({ p }: { p: PlaceItem }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm hover:shadow-md transition-all">
      <div className="relative h-48 w-full overflow-hidden">
        {p.image?.secure_url ? (
          <img
            src={p.image.secure_url}
            alt={p.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col">
        <h3 className="line-clamp-1 text-base font-semibold">
          {p.title || p.name}
        </h3>
        {p.category?.title && (
          <p className="text-xs text-muted-foreground mt-1">
            {p.category.title}
          </p>
        )}
      </div>
                      <Button variant="secondary" className="mt-3" >
                          Details
                      </Button>
    </div>
  );
}

/* =========================================================
   🔎 Toolbar (Search)
========================================================= */
function PlacesToolbar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (v: string) => void;
}) {
  return (
    <div className="flex justify-end items-center gap-2 mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <Search className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2">
          <DropdownMenuLabel>Search Places</DropdownMenuLabel>
          <Input
            autoFocus
            placeholder="Search places..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-2"
          />
        </DropdownMenuContent>
      </DropdownMenu>
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
   🧭 Pagination
========================================================= */
function PageNavigator({ totalPages, page, onPageChange, t }: any) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <div className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> {t("Prev")}
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
                                className={[
                                    "cursor-pointer h-8 min-w-8 rounded-md px-2 text-sm",
                                    n === page
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
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          {t("Next")}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
