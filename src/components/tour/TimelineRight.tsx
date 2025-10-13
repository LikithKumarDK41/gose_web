"use client";

import { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/lib/store"; // Import AppDispatch type
import {
  clearMonumentDetail,
  fetchMonumentDetails,
} from "@/lib/store/slices/touristSlice"; // Import the new thunk for fetching monument details
import Image from "next/image";
import type { Place } from "@/lib/data/tourTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ImageIcon,
  Car,
  Bike,
  Bus,
  Train,
  Footprints,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";

export type TravelMode =
  | "walk"
  | "drive"
  | "cycle"
  | "transit"
  | "train"
  | "other";

export interface Monument {
  _id: string;
  name: string;
  title?: string;
  description?: string;
  image?: {
    secure_url?: string;
    url?: string;
    resource_type?: string;
    format?: string;
    height?: number;
    width?: number;
    signature?: string;
    version?: number;
    public_id?: string;
  };
  gallery?: Array<{
    public_id?: string;
    version?: number;
    signature?: string;
    width?: number;
    height?: number;
    format?: string;
    resource_type?: string;
    url?: string;
    secure_url?: string;
    _id?: string;
  }>;
  location?: { lat?: number; lng?: number } | [number, number];
  region?: {
    _id?: string;
    slug?: string;
    name?: string;
    title?: string;
    location?: [number, number];
    featuredmonument?: string[];
    content?: {
      brief?: string;
      extended?: string;
    };
    state?: string;
  };
  popularity?: number;
  imagecredit?: { en?: string; ja?: string };
  nearbyservices?: any[];
  nearbymonuments?: any[];
  subtheme?: any[];
  theme?: any[];
  artemplates?: any[];
  arenabled?: boolean;
  avenabled?: boolean;
  rare?: boolean;
  featured?: boolean;
  era?: string;
  year?: string;
  size?: string;
  mtype?: string;
  access?: string;
  content?: { brief?: string; extended?: string };
  state?: string;
  tourpoint?: boolean;
  georadius?: number;
}
// PlaceCompat type definition with the monument field as Partial<Monument>
export type PlaceCompat = Place & {
  name?: string;
  tags?: string[];
  address?: string;
  visitDurationMin?: number;
  highlights?: string[];
  tips?: string;
  travelFromPrev?: {
    mode?: TravelMode;
    distanceMeters?: number;
    durationMin?: number;
  };
  monument?: Partial<Monument>; // Monument is optional and partially filled
};

export default function TimelineRight({ places }: { places: PlaceCompat[] }) {
  const dispatch = useDispatch<AppDispatch>();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeMonumentData, setActiveMonumentData] = useState<any | null>(
    null
  );
  const [modalLoading, setModalLoading] = useState(false);
  const { show, hide } = useGlobalLoader();
  const loading = useSelector((state: any) => state.tourist.loading);
  const active = useMemo(
    () => places.find((p) => p.id === openId) ?? null,
    [openId, places]
  );
  const { t } = useLocale();
  const [modalStack, setModalStack] = useState<
    { id: string; data?: any; loading: boolean }[]
  >([]);

  const monumentDetail = useSelector(
    (state: any) => state.tourist.monumentDetail
  );

  const handleOpenMonumentModal = async (id: string) => {
    // Push placeholder (loading)
    setModalStack((prev) => [...prev, { id, loading: true }]);

    try {
      const thunk = dispatch(fetchMonumentDetails(id));
      const data = await thunk.unwrap();
      setModalStack((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { id, data, loading: false };
        return updated;
      });
    } catch (err) {
      console.error("Failed to fetch monument", err);
      setModalStack((prev) => prev.slice(0, -1)); // pop failed
    }
  };

  // Close the top-most modal
  const handleCloseTopModal = () => {
    setModalStack((prev) => prev.slice(0, -1));
  };

  // Effect to fetch monument details if the place has a monument with tourpoint: true
  useEffect(() => {
    // Check if active and the monument _id exist
    if (!active?.monument?._id) return;

    // Fetch monument details only if not already loaded or if the loaded details are different
    if (!monumentDetail || monumentDetail._id !== active.monument._id) {
      const thunk = dispatch(fetchMonumentDetails(active.monument._id));

      // Handle any errors that may occur during the fetch
      thunk.unwrap().catch((err: any) => {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        console.error("fetchMonumentDetails failed", err);
      });
    }

    return () => {
      // Abort the fetch if the component unmounts or active monument changes
    };
  }, [active, dispatch, monumentDetail]);

  useEffect(() => {
    if (!active) return;

    if (!active.monument?._id) {
      // 🧹 Clear old monument detail if switching to a start/end point
      dispatch(clearMonumentDetail());
      return;
    }

    // Fetch monument detail only if needed
    if (!monumentDetail || monumentDetail._id !== active.monument._id) {
      const thunk = dispatch(fetchMonumentDetails(active.monument._id));
      thunk.unwrap().catch((err: any) => {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        console.error("fetchMonumentDetails failed", err);
      });
    }
  }, [active, dispatch, monumentDetail]);

  const handlePlaceClick = async (placeId: string) => {
    setOpenId(placeId);
    const selected = places.find((p) => p.id === placeId);
    if (!selected?.monument?._id) return;

    setModalLoading(true);
    try {
      const thunk = dispatch(fetchMonumentDetails(selected.monument._id));
      const data = await thunk.unwrap();
      setActiveMonumentData(data);
    } catch (err) {
      console.error("Failed to fetch monument", err);
    } finally {
      setModalLoading(false);
    }
  };
  const isLoading = loading; // Is the monument being loaded
  const activeMonumentId = active?.monument?._id;

  // ✅ Only use monumentDetail if it matches the active monument
  const detailsToShow =
    activeMonumentId && monumentDetail?._id === activeMonumentId
      ? monumentDetail
      : active?.monument || active;

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="pointer-events-none absolute left-8 top-0 bottom-0 w-px bg-border/70" />

      <ul className="space-y-12 md:space-y-14">
        {places.map((p, idx) => {
          const label = labelFor(places, idx);
          const accent = dynamicColor(idx, p.kind);
          const tags = p.tags ?? [];
          const leg = p.travelFromPrev;

          return (
            <li
              key={p.id}
              className="grid grid-cols-[64px_1fr] items-start gap-4 sm:gap-6"
            >
              {idx > 0 && (
                <div className="col-span-2 -mb-6 -mt-6 pl-[80px] md:-mb-7 md:-mt-7">
                  <LegPill accent={accent} leg={leg} t={t} />
                </div>
              )}

              <div className="relative h-full w-16">
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-border/50" />
                <div className="absolute left-1/2 top-0 -translate-x-1/2">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-full text-white shadow-md ring-2 ring-white/80 dark:ring-white/20"
                    style={{ background: accent }}
                  >
                    <span className="text-[11px] font-semibold">{label}</span>
                  </div>
                </div>
              </div>

              <article className="group relative grid w-full grid-cols-1 gap-5 overflow-hidden rounded-2xl border bg-card/80 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur transition-all hover:-translate-y-[2px] hover:shadow-md dark:ring-white/10 sm:grid-cols-[440px_1fr]">
                <div
                  className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{
                    background:
                      "radial-gradient(60% 40% at 0% 0%, rgba(99,102,241,.18), transparent 60%), radial-gradient(60% 40% at 100% 0%, rgba(56,189,248,.16), transparent 60%)",
                  }}
                />

                <button
                  aria-label={t("tourDetails.openPlace", { name: p.name })}
                  onClick={() => handlePlaceClick(p.id)} // Update the openId when the button is clicked
                  className="relative h-64 w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border"
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 520px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      priority={idx < 2}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className="truncate text-lg font-semibold"
                      title={p.name}
                      onClick={() => handlePlaceClick(p.id)} // Update the openId when the place is clicked
                      role="button"
                    >
                      {p.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <ModeChip mode={leg?.mode} t={t} />
                      {p.time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {t("tourDetails.time")}: {p.time}
                        </div>
                      )}
                    </div>
                  </div>

                  {p.address && (
                    <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{p.address}</span>
                    </div>
                  )}

                  {p.blurb && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {(p.blurb || "")
                        .replace(/<style[\s\S]*?<\/style>/gi, "")
                        .replace(/<script[\s\S]*?<\/script>/gi, "")
                        .replace(/<!--[\s\S]*?-->/g, "")
                        .replace(/<[^>]+>/g, "")
                        .replace(/&nbsp;|&#160;/gi, " ")
                        .replace(/\u00A0/g, " ")
                        .replace(/[\u200B-\u200D\uFEFF]/g, "")
                        .replace(/\s+/g, " ")
                        .trim() || null}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                    {p.visitDurationMin != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        {p.visitDurationMin} {t("tourDetails.minOnSite")}
                      </span>
                    )}
                    {!!p.highlights?.length && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        {p.highlights.length}{" "}
                        {p.highlights.length > 1
                          ? t("tourDetails.highlightsPlural")
                          : t("tourDetails.highlightsSingular")}
                      </span>
                    )}
                  </div>

                  {!!tags.length && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.slice(0, 6).map((tTag, i) => (
                        <Badge
                          key={tTag}
                          variant="secondary"
                          className="rounded-md px-1.5 py-0 text-[10px]"
                          style={{
                            borderColor: dynamicColor(idx + i),
                            borderWidth: 1,
                          }}
                        >
                          {tTag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => handlePlaceClick(p.id)}
                    >
                      {t("tourDetails.viewDetails")}
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {/* details dialog */}
      <Dialog
        open={!!active}
        onOpenChange={(o) => {
          if (!o) {
            setOpenId(null);
            setActiveMonumentData(null);
          }
        }}
      >
        <DialogContent
          className="
    w-full max-w--[90vw] lg:max-w-[60vw] 
    max-h-[90vh] overflow-y-auto
    rounded-xl p-4 sm:p-4
    scrollbar-hide
    [scrollbar-width:none]
    [-ms-overflow-style:none]
  "
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <DialogHeader>
  <DialogTitle>
    {modalLoading
      ? "Loading..."
      : activeMonumentData?.title ||
        activeMonumentData?.name ||
        active?.name ||
        t("tourDetails.noDetails")}
  </DialogTitle>
  {!!active?.time && (
    <DialogDescription>
      {t("tourDetails.time")}: {active.time}
    </DialogDescription>
  )}
</DialogHeader>

         {/* Monument or Place Details */}
{modalLoading ? (
  <div className="flex justify-center items-center p-6 text-muted-foreground">
    
  </div>
) : activeMonumentData ? (
  /* ✅ Show fetched monument data */
  <div className="space-y-4 mb-2">
    <div className="relative h-56 w-full overflow-hidden rounded-md bg-muted">
      {activeMonumentData.image?.secure_url ? (
        <Image
          src={activeMonumentData.image.secure_url}
          alt={activeMonumentData.name || ""}
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted-foreground">
          <ImageIcon className="h-6 w-6" />
        </div>
      )}
    </div>

    {activeMonumentData.content?.brief && (
      <p className="text-sm text-muted-foreground leading-relaxed">
        {(activeMonumentData.content.brief || "")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;|&#160;/gi, " ")
          .trim()}
      </p>
    )}

    {!!activeMonumentData.relatedtours?.length && (
  <div className="pt-6 border-t border-border">
    <h4 className="text-base font-semibold mb-3">Related Tours</h4>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeMonumentData.relatedtours.map((tour: any) => (
        <div
          key={tour._id}
          className="group rounded-lg overflow-hidden border bg-card/60 ring-1 ring-border hover:ring-primary/40 hover:shadow-md transition-all"
        >
          <div className="relative h-36 w-full">
            {tour.image?.secure_url ? (
              <Image
                src={tour.image.secure_url}
                alt={tour.title}
                fill
                sizes="(max-width: 640px) 100vw, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          <div className="p-3 space-y-1">
            <h5 className="text-sm font-medium truncate">{tour.title}</h5>

            {tour.content?.brief && (
              <p className="text-xs text-muted-foreground line-clamp-3">
                {tour.content.brief
                  .replace(/<[^>]+>/g, "")
                  .replace(/&nbsp;|&#160;/gi, " ")
                  .trim()}
              </p>
            )}

            <Button
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                if (tour._id) {
                  window.open(`/tours/detail?id=${tour._id}`, "_self");
                }
              }}
            >
              View Tour
            </Button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

    {/* Nearby Monuments */}
    {!!activeMonumentData.nearbymonuments?.length && (
      <div className="pt-6 border-t border-border">
        <h4 className="text-base font-semibold mb-3">
          Nearby Monuments
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMonumentData.nearbymonuments.map((monument: any) => (
            <div
              key={monument._id}
              className="group rounded-lg overflow-hidden border bg-card/60 ring-1 ring-border hover:ring-primary/40 hover:shadow-md transition-all"
            >
              <div className="relative h-36 w-full">
                {monument.image?.secure_url ? (
                  <Image
                    src={monument.image.secure_url}
                    alt={monument.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="p-3 space-y-1">
                <h5 className="text-sm font-medium truncate">
                  {monument.title}
                </h5>

                {monument.content?.brief && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {monument.content.brief
                      .replace(/<[^>]+>/g, "")
                      .replace(/&nbsp;|&#160;/gi, " ")
                      .trim()}
                  </p>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={async () => {
                    if (!monument._id) return;
                    setModalLoading(true);
                    try {
                      const thunk = dispatch(
                        fetchMonumentDetails(monument._id)
                      );
                      const data = await thunk.unwrap();
                      setActiveMonumentData(data);
                    } catch (err) {
                      console.error("Failed to fetch monument", err);
                    } finally {
                      setModalLoading(false);
                    }
                  }}
                >
                  View Monument
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
) : (
  /* ✅ Fallback when there’s no monument (show place details) */
  <div className="space-y-4 mb-2">
    <div className="relative h-56 w-full overflow-hidden rounded-md bg-muted">
      {active?.image ? (
        <Image
          src={active.image}
          alt={active.name || ""}
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted-foreground">
          <ImageIcon className="h-6 w-6" />
        </div>
      )}
    </div>

    {active?.blurb && (
      <p className="text-sm text-muted-foreground leading-relaxed">
        {(active.blurb || "")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;|&#160;/gi, " ")
          .trim()}
      </p>
    )}
  </div>
)}

          {isLoading && (
            <div className="flex justify-center items-center p-4">
              <span>Loading...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
/* ------------------------ helpers ------------------------ */
function dynamicColor(i: number, kind?: "start" | "place" | "end") {
  if (kind === "start") return "hsl(150 70% 40%)"; // 🟢 green
  if (kind === "end") return "hsl(0 75% 50%)"; // 🔴 red
  return "hsl(30 90% 50%)"; // 🟠 orange for middle steps
}

function labelFor(places: PlaceCompat[], idx: number) {
  const p = places[idx];
  if (!p) return "";

  // Explicit start/end markers: no number
  if (p.kind === "start") return "";
  if (p.kind === "end") return "";

  // Otherwise, number *excluding* start point from count
  const visibleIndex = places
    .slice(0, idx)
    .filter((x) => x.kind !== "start").length;
  return String(visibleIndex + 1);
}

function fmtMeters(m?: number) {
  if (m == null) return "";
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

function fmtMinutes(min?: number) {
  if (min == null) return "";
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const mm = Math.round(min % 60);
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

function modeStyles(mode?: TravelMode) {
  switch (mode) {
    case "drive":
      return {
        bg: "bg-sky-500/10",
        ring: "ring-sky-500/30",
        text: "text-sky-700 dark:text-sky-300",
        icon: <Car className="h-3.5 w-3.5" />,
        label: "Drive",
      };
    case "cycle":
      return {
        bg: "bg-amber-500/10",
        ring: "ring-amber-500/30",
        text: "text-amber-700 dark:text-amber-300",
        icon: <Bike className="h-3.5 w-3.5" />,
        label: "Cycle",
      };
    case "transit":
      return {
        bg: "bg-violet-500/10",
        ring: "ring-violet-500/30",
        text: "text-violet-700 dark:text-violet-300",
        icon: <Bus className="h-3.5 w-3.5" />,
        label: "Transit",
      };
    case "other":
      return {
        bg: "bg-slate-500/10",
        ring: "ring-slate-500/30",
        text: "text-slate-700 dark:text-slate-300",
        icon: <Train className="h-3.5 w-3.5" />,
        label: "Transfer",
      };
    case "train":
      return {
        bg: "bg-slate-500/10",
        ring: "ring-slate-500/30",
        text: "text-slate-700 dark:text-slate-300",
        icon: <Train className="h-3.5 w-3.5" />,
        label: "Train",
      };
    case "walk":
    default:
      return {
        bg: "bg-emerald-500/10",
        ring: "ring-emerald-500/30",
        text: "text-emerald-700 dark:text-emerald-300",
        icon: <Footprints className="h-3.5 w-3.5" />,
        label: "Walk",
      };
  }
}

function ModeChip({ mode, t }: { mode?: TravelMode; t: any }) {
  const s = modeStyles(mode);
  const label = t(`tourDetails.modes.${s.label.toLowerCase()}`, {
    defaultValue: s.label,
  });
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        s.bg,
        s.ring,
        s.text,
        "ring-1",
      ].join(" ")}
      title={label}
    >
      {s.icon}
      {label}
    </span>
  );
}

function LegPill({
  accent,
  leg,
  t,
}: {
  accent: string;
  leg?: PlaceCompat["travelFromPrev"];
  t: any;
}) {
  const s = modeStyles(leg?.mode);
  const label = t(`tourDetails.modes.${s.label.toLowerCase()}`, {
    defaultValue: s.label,
  });
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] shadow bg-card/95 ring-1 ring-border">
      <span
        className={[
          "inline-flex items-center justify-center rounded-full p-1",
          s.bg,
          s.text,
          s.ring,
          "ring-1",
        ].join(" ")}
        style={{ boxShadow: `0 0 0 2px ${accent}22 inset` }}
        aria-hidden
      >
        {s.icon}
      </span>

      <span className="font-semibold">{label}</span>

      {leg?.distanceMeters != null && (
        <>
          <span className="opacity-60">•</span>
          <span>{fmtMeters(leg.distanceMeters)}</span>
        </>
      )}
      {leg?.durationMin != null && (
        <>
          <span className="opacity-60">•</span>
          <span>{fmtMinutes(leg.durationMin)}</span>
        </>
      )}
    </div>
  );
}
