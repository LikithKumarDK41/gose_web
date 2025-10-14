"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/lib/store";
import {
  fetchMonumentDetails,
  type TourPoint,
  type Monument,
} from "@/lib/store/slices/touristSlice";
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
  MapPin,
  Landmark,
  Sparkles,
  Store,
  Navigation,
} from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";

/* ------------------------------------------------------------------ */
export default function TimelineRight({ tourpoints }: { tourpoints: TourPoint[] }) {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useLocale();
  const { show, hide } = useGlobalLoader();

  const loading = useSelector((s: any) => s.tourist.loading);
  const monumentDetail = useSelector((s: any) => s.tourist.monumentDetail);

  const [openId, setOpenId] = useState<string | null>(null);
  const [activeMonument, setActiveMonument] = useState<Monument | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const active = useMemo(
    () => tourpoints.find((p) => p._id === openId) ?? null,
    [openId, tourpoints]
  );

  useEffect(() => {
    if (loading) show();
    else hide();
  }, [loading, show, hide]);

  const handleOpen = async (id: string) => {
    setOpenId(id);
    const point = tourpoints.find((p) => p._id === id);
    const targetId = point?.monument?._id || id;
    if (!targetId) return;

    setModalLoading(true);
    try {
      const thunk = dispatch(fetchMonumentDetails(targetId));
      const data = await thunk.unwrap();
      setActiveMonument(data);
    } catch (err) {
      console.error("Failed to fetch monument:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const details =
    activeMonument && monumentDetail?._id === activeMonument._id
      ? monumentDetail
      : activeMonument ?? active?.monument;

  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* Timeline list */}
      <div className="relative mx-auto w-full max-w-6xl">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border/60" />
        <ul className="space-y-10 md:space-y-12">
          {tourpoints.map((p, i) => {
            const accent = dynamicColor(i, p.waypointtype);
            const m = p.monument;

            return (
              <li key={p._id} className="grid grid-cols-[64px_1fr] gap-4 items-start">
                {/* timeline dot */}
                <div className="relative h-full w-16">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/40 -translate-x-1/2" />
                  <div className="absolute left-1/2 top-0 -translate-x-1/2">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-full text-white shadow-md ring-2 ring-white/70 dark:ring-white/15"
                      style={{ background: accent }}
                    >
                      <span className="text-[11px] font-semibold">{i + 1}</span>
                    </div>
                  </div>
                </div>

                {/* card */}
                <article
                  key={p._id}
                  className="relative col-start-2 w-full overflow-hidden rounded-2xl bg-black text-white shadow-lg transition hover:-translate-y-[2px] hover:shadow-xl"
                >
                  {/* Image section */}
                  <div
                    className="relative w-full h-60 cursor-pointer"
                    onClick={() => handleOpen(p._id)}
                  >
                    {m?.image?.secure_url ? (
                      <Image
                        src={m.image.secure_url}
                        alt={m.name ?? ""}
                        fill
                        className="object-cover opacity-90 hover:opacity-100 transition"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-zinc-800">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {/* subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>

                  {/* Content section */}
                  <div className="p-5">
                    <h3
                      onClick={() => handleOpen(p._id)}
                      className="cursor-pointer text-lg font-semibold truncate hover:text-primary transition"
                    >
                      {m?.title ?? m?.name ?? p.name}
                    </h3>

                    {m?.region?.title && (
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                        <MapPin className="h-4 w-4" />
                        <span>{m.region.title}</span>
                      </div>
                    )}

                    {/* Show both brief and extended content */}
                    {(m?.content?.brief || m?.content?.extended) && (
                      <div className="mt-3 space-y-1 text-sm text-zinc-300">
                        {m?.content?.brief && (
                          <p className="line-clamp-2">
                            {m.content.brief.replace(/<[^>]+>/g, "").trim()}
                          </p>
                        )}
                        {m?.content?.extended && (
                          <p className="line-clamp-2 italic text-zinc-400">
                            {m.content.extended.replace(/<[^>]+>/g, "").trim()}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex gap-3">
                      <Button
                        size="sm"
                        className="flex-1 rounded-full bg-zinc-100 text-black hover:bg-white"
                        onClick={() => handleOpen(p._id)}
                      >
                        {t("tourDetails.viewDetails")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-full border-zinc-500 text-zinc-300 hover:bg-zinc-800"
                      >
                        <MapPin className="h-4 w-4" />
                        {t("tourDetails.checkIn")}
                      </Button>
                    </div>
                  </div>
                </article>


              </li>
            );
          })}
        </ul>
      </div>

      {/* ================= Fullscreen Modal ================= */}
      <Dialog open={!!active} onOpenChange={() => setOpenId(null)}>
        <DialogContent className="z-50 w-screen h-screen bg-background p-0 !max-w-full">
          {/* Header row */}
          <DialogHeader className="flex items-center justify-between border-b bg-background py-4 px-8">
            <div>
              <DialogTitle className="text-xl font-semibold truncate">
                {details?.title || details?.name || "Details"}
              </DialogTitle>
              {active?.traveltype?.name && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {t("tourDetails.mode")}: {active.traveltype.name}
                </DialogDescription>
              )}
            </div>
          </DialogHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10">
            {modalLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : (
              details && (
                <>
                  {/* Hero */}
                  {details.image?.secure_url && (
                    <div className="relative h-[420px] w-full overflow-hidden rounded-xl ring-1 ring-border">
                      <Image
                        src={details.image.secure_url}
                        alt={details.title ?? ""}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Title + Region */}
                  <section>
                    <h2 className="text-xl font-bold">{details.title || details.name}</h2>
                    {details.region && (
                      <p className="mt-1 text-sm flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {details.region.title || details.region.name}
                      </p>
                    )}
                  </section>

                  {/* Description */}
                  {(details.content?.brief || details.content?.extended) && (
                    <section className="prose max-w-none text-sm leading-relaxed text-muted-foreground space-y-3">
                      {details.content?.brief && (
                        <div dangerouslySetInnerHTML={{ __html: details.content.brief }} />
                      )}
                      {details.content?.extended && (
                        <div dangerouslySetInnerHTML={{ __html: details.content.extended }} />
                      )}
                    </section>
                  )}

                  {/* Attributes */}
                  <section className="flex flex-wrap gap-2">
                    {details.era && <Badge>Era: {details.era}</Badge>}
                    {details.year && <Badge>Year: {details.year}</Badge>}
                    {details.size && <Badge>Size: {details.size}</Badge>}
                    {details.mtype && <Badge>Type: {details.mtype}</Badge>}
                    {details.access && <Badge>Access: {details.access}</Badge>}
                    {details.rare && <Badge variant="outline">Rare</Badge>}
                  </section>

                  {/* Gallery */}
                  {!!details.gallery?.length && (
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 font-semibold">
                        <ImageIcon className="h-4 w-4" /> Gallery
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {details.gallery.map(
                          (img: any) =>
                            img.secure_url && (
                              <div key={img.secure_url} className="relative h-40 overflow-hidden rounded-md">
                                <Image
                                  src={img.secure_url}
                                  alt=""
                                  fill
                                  className="object-cover hover:scale-105 transition-transform"
                                />
                              </div>
                            )
                        )}
                      </div>
                    </section>
                  )}

                  {/* Related Tours */}
                  {!!details.relatedtours?.length && (
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 font-semibold">
                        <Navigation className="h-4 w-4" /> Related Tours
                      </h3>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {details.relatedtours.map((tour: any) => (
                          <div
                            key={tour._id}
                            className="overflow-hidden rounded-xl border bg-card flex flex-col h-full"
                          >
                            {tour.image?.secure_url ? (
                              <div className="relative h-36">
                                <Image
                                  src={tour.image.secure_url}
                                  alt={tour.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="grid h-36 place-items-center bg-muted">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex flex-col justify-between h-full p-3">
                              <div>
                                <h4 className="text-sm font-medium line-clamp-1">{tour.title}</h4>
                                {tour.content?.brief && (
                                  <p className="text-xs text-muted-foreground line-clamp-3 mt-1">
                                    {tour.content.brief.replace(/<[^>]+>/g, "").trim()}
                                  </p>
                                )}
                              </div>
                              <div className="mt-3 flex justify-center">
                                <Button
                                  size="sm"
                                  className="rounded-full w-[140px]"
                                  onClick={() =>
                                    (window.location.href = `http://localhost:3000/tours/detail/?id=${tour._id}`)
                                  }
                                >
                                  Go to Tour
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Nearby Monuments */}
                  {!!details.nearbymonuments?.length && (
                    <section>
                      <h3 className="mb-2 flex items-center gap-2 font-semibold">
                        <Landmark className="h-4 w-4" /> Nearby Monuments
                      </h3>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {details.nearbymonuments.map((m: any) => (
                          <div
                            key={m._id}
                            className="overflow-hidden rounded-xl border bg-card flex flex-col h-full"
                          >
                            {m.image?.secure_url ? (
                              <div className="relative h-36">
                                <Image
                                  src={m.image.secure_url}
                                  alt={m.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="grid h-36 place-items-center bg-muted">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex flex-col justify-between h-full p-3">
                              <h4 className="text-sm font-medium line-clamp-1">{m.title}</h4>
                              <div className="mt-3 flex justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full w-[140px]"
                                  onClick={() => handleOpen(m._id)}
                                >
                                  See Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Nearby Services */}
                  {!!details.nearbyservices?.length && (
                    <section>
                      <h3 className="mb-2 flex items-center gap-2 font-semibold">
                        <Store className="h-4 w-4" /> Nearby Services
                      </h3>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {details.nearbyservices.map((svc: any) => (
                          <div key={svc._id} className="rounded-xl border p-3 bg-card">
                            <h4 className="font-medium">{svc.title || svc.name}</h4>
                            {svc.content?.brief && (
                              <p className="text-xs text-muted-foreground line-clamp-3">
                                {svc.content.brief.replace(/<[^>]+>/g, "").trim()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )
            )}
          </div>

          {/* Bottom full-width Check-in button */}
          <div className="border-t bg-background p-6">
            <Button size="lg" className="w-full rounded-full flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              {t("tourDetails.checkIn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
function dynamicColor(i: number, type?: "start" | "place" | "end") {
  if (type === "start") return "hsl(150 70% 40%)";
  if (type === "end") return "hsl(0 75% 50%)";
  return "hsl(30 90% 50%)";
}
