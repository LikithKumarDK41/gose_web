// src/components/tour/TimelineRight.tsx
"use client";

import { useMemo, useState } from "react";
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

type Mode = "walk" | "drive" | "cycle" | "transit" | "other";
type PlaceCompat = Place & {
  tags?: string[];
  address?: string;
  visitDurationMin?: number;
  highlights?: string[];
  tips?: string;
  travelFromPrev?: {
    mode?: Mode;
    distanceMeters?: number;
    durationMin?: number;
  };
};

export default function TimelineRight({ places }: { places: PlaceCompat[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = useMemo(() => places.find((p) => p.id === openId) ?? null, [
    openId,
    places,
  ]);
  const { t } = useLocale();

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="pointer-events-none absolute left-8 top-0 bottom-0 w-px bg-border/70" />

      <ul className="space-y-12 md:space-y-14">
        {places.map((p, idx) => {
          const label = labelFor(places, idx);
          const accent = dynamicColor(idx);
          const tags = p.tags ?? [];
          const leg = p.travelFromPrev;

          return (
            <li key={p.id} className="grid grid-cols-[64px_1fr] items-start gap-4 sm:gap-6">
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
                  aria-label={t('tourDetails.openPlace', { name: p.name })}
                  onClick={() => setOpenId(p.id)}
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
                      onClick={() => setOpenId(p.id)}
                      role="button"
                    >
                      {p.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <ModeChip mode={leg?.mode} t={t} />
                      {p.time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {t('tourDetails.time')}: {p.time}
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
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.blurb}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                    {p.visitDurationMin != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        {p.visitDurationMin} {t('tourDetails.minOnSite')}
                      </span>
                    )}
                    {!!p.highlights?.length && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        {p.highlights.length}{" "}
                        {p.highlights.length > 1 ? t('tourDetails.highlightsPlural') : t('tourDetails.highlightsSingular')}
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
                    <Button size="sm" className="rounded-full" onClick={() => setOpenId(p.id)}>
                      {t('tourDetails.viewDetails')}
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {/* details dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{active?.name}</DialogTitle>
            {!!active?.time && (
              <DialogDescription>
                {t('tourDetails.time')}: {active.time}
              </DialogDescription>
            )}
          </DialogHeader>

          {!!active && (
            <div className="space-y-4">
              <div className="relative h-56 w-full overflow-hidden rounded-md bg-muted">
                {active.image ? (
                  <Image
                    src={active.image}
                    alt={active.name}
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

              {active.address && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{active.address}</span>
                </div>
              )}

              {active.blurb && (
                <p className="text-sm text-muted-foreground">{active.blurb}</p>
              )}

              {!!active.highlights?.length && (
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {active.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}

              {active.tips && (
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  {active.tips}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------ helpers ------------------------ */

function dynamicColor(i: number) {
  const hue = (i * 137.508) % 360;
  return `hsl(${hue} 70% 46%)`;
}

function labelFor(places: PlaceCompat[], idx: number) {
  const p = places[idx];
  const isEnd = p.kind === "end" || idx === places.length - 1;
  return isEnd ? "E" : String(idx + 1);
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

function modeStyles(mode?: Mode) {
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

function ModeChip({ mode, t }: { mode?: Mode; t: any }) {
  const s = modeStyles(mode);
  const label = t(`tourDetails.modes.${s.label.toLowerCase()}`, { defaultValue: s.label });
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

function LegPill({ accent, leg, t }: { accent: string; leg?: PlaceCompat["travelFromPrev"]; t: any }) {
  const s = modeStyles(leg?.mode);
  const label = t(`tourDetails.modes.${s.label.toLowerCase()}`, { defaultValue: s.label });
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] shadow bg-card/95 ring-1 ring-border">
      <span
        className={["inline-flex items-center justify-center rounded-full p-1", s.bg, s.text, s.ring, "ring-1"].join(" ")}
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
