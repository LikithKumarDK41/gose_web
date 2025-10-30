"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Search, ChevronLeft, ChevronRight, Landmark, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MonumentDetailModal from "@/components/tour/MonumentDetailModal";
import {
    apiFetchAllMonuments,
    apiFetchMonumentDetails,
    apiFetchMonumentSorts
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
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

/* =========================================================
   🏛️ Monuments Page (Design-matched with LibraryPage)
========================================================= */
export default function MonumentsPage() {
    const { t } = useLocale();

    const [monuments, setMonuments] = useState<Monument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 6;

    const [open, setOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedMonument, setSelectedMonument] = useState<Monument | null>(null);

    /* -------------------- Fetch All Monuments -------------------- */
    useEffect(() => {
        let mounted = true;

        const loadMonuments = async () => {
            try {
                setLoading(true);
                const data = await apiFetchAllMonuments();
                if (mounted) setMonuments(data);
            } catch (err: any) {
                console.error("Failed to fetch monuments:", err);
                setError(err.message || "Failed to fetch monuments");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadMonuments();
        return () => {
            mounted = false;
        };
    }, []);

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
       💠 Render
    ========================================================= */
    if (loading)
        return (
            <div className="text-center text-lg text-gray-500 mt-10">{t("Loading...")}</div>
        );

    if (error)
        return (
            <div className="text-center text-lg text-red-500 mt-10">{error}</div>
        );

    return (
        <div className="space-y-10">
            {/* ===== HEADER ===== */}
            <div className="relative overflow-hidden rounded-2xl border">
                <div className="pointer-events-none absolute -top-20 -right-8 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-400 opacity-60 blur-3xl dark:opacity-40" />
                <div className="relative p-6 sm:p-7 text-center">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white shadow ring-1 ring-white/10 backdrop-blur">
                        <Landmark className="h-3.5 w-3.5" />
                        {t("All Monuments")}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mt-3">
                        {t("Explore Nara Heritage Sites")}
                    </h1>
                </div>
            </div>

            {/* ===== SEARCH + FILTER BAR ===== */}
            <MonumentsToolbar
                query={query}
                setQuery={setQuery}
                onSortSelect={(v) => console.log("Sort:", v)}
                onFilterSelect={(v) => console.log("Filter:", v)}
            />

            {/* ===== EMPTY STATE ===== */}
            {filtered.length === 0 && (
                <EmptyState
                    icon={<Landmark className="h-8 w-8" />}
                    title={t("No monuments found")}
                    subtitle={t("Try a different search term or check back later.")}
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
        <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm hover:shadow-md transition-all">
            <div className="relative h-48 w-full overflow-hidden">
                {m.image?.secure_url ? (
                    <img
                        src={m.image.secure_url}
                        alt={m.title || m.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                    <h3 className="line-clamp-1 text-base font-semibold">
                        {m.title || m.name}
                    </h3>
                    {m.region?.title && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("Region")}: {m.region.title}
                        </p>
                    )}
                </div>
                <Button variant="secondary" className="mt-3" onClick={onOpen}>
                    {t("Details")}
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
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t("Prev")}
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
        <div className="grid place-items-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/60 to-indigo-50/40 dark:from-gray-900/50 dark:to-gray-800/50 p-10 text-center shadow-inner">
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground shadow">
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
export function MonumentsToolbar({
    query,
    setQuery,
    onSortSelect,
    onFilterSelect,
}: {
    query: string;
    setQuery: (v: string) => void;
    onSortSelect: (v: string) => void;
    onFilterSelect: (v: string) => void;
}) {
    const [sortOptions, setSortOptions] = useState<MonumentSort[]>([]);
    const [loadingSorts, setLoadingSorts] = useState(false);

    /* -------------------- Fetch Sort Options -------------------- */
    useEffect(() => {
        let mounted = true;
        const loadSorts = async () => {
            try {
                setLoadingSorts(true);
                const data = await apiFetchMonumentSorts();
                if (mounted) {
                    // Sort by priority ascending
                    const sorted = data.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
                    setSortOptions(sorted);
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
            {/* Search Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                        <Search className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                    <DropdownMenuLabel>Search Monuments</DropdownMenuLabel>
                    <Input
                        autoFocus
                        placeholder="Type to search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="mt-2"
                    />
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                        <Filter className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onFilterSelect("featured")}>
                        Featured
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFilterSelect("rare")}>
                        Rare
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFilterSelect("arenabled")}>
                        AR Enabled
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFilterSelect("avenabled")}>
                        AV Enabled
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown (dynamic) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {loadingSorts ? (
                        <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                    ) : sortOptions.length > 0 ? (
                        sortOptions.map((s) => (
                            <DropdownMenuItem
                                key={s._id}
                                onClick={() => onSortSelect(s.link || s.name || "")}
                                className="flex items-center gap-2"
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
                        <DropdownMenuItem disabled>No sort options</DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}