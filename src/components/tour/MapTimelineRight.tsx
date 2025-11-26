"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/lib/store";
import { fetchMonumentDetails } from "@/lib/store/slices/touristSlice";
import {
  type TourPoint,
  type Monument,
  type TravelMode,
} from "@/lib/types/userTour.types";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  MapPin,
  Footprints,
  Train,
  Car,
  UtensilsCrossed,
} from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import MonumentDetailModal from "@/components/tour/MonumentDetailModal";
import { getPersistedUser } from "@/services/userAuthService";
import { toast } from "sonner";
import { apiCreateVisitHistory } from "@/services/myListService";
import { apiCreateStamp } from "@/services/userNavService";
import type { VisitHistoryPayload, VisitHistory } from "@/services/myListService";

/* ------------------------------------------------------------------ */
export default function TimelineRight({
  tourpoints,
  customStyle,
}: {
  tourpoints: TourPoint[];
  customStyle?: string;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useLocale();
  const { show, hide } = useGlobalLoader();
  const persisted = getPersistedUser();
  const userId = persisted?.user?._id ?? null;

  const loading = useSelector((s: any) => s.tourist.loading);
  const monumentDetail = useSelector((s: any) => s.tourist.monumentDetail);

  const [openId, setOpenId] = useState<string | null>(null);
  const [activeMonument, setActiveMonument] = useState<Monument | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const hasStart = tourpoints.some((tp) => tp.waypointtype === "start"); // 👈 check once

  const active = useMemo(
    () => tourpoints.find((p) => p._id === openId) ?? null,
    [openId, tourpoints]
  );

  /* -------------------- Load bookmarks -------------------- */
  useEffect(() => {
    if (loading) show();
    else hide();
  }, [loading, show, hide]);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 600);
    return () => clearTimeout(timer);
  }, [tourpoints]);

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

  /* -------------------- Loading Skeleton -------------------- */
  if (initialLoading) {
    return (
      <div className="relative mx-auto w-full max-w-6xl animate-pulse">
        <div className="absolute left-[52px] top-0 bottom-0 w-[3px] bg-orange-300 rounded-full" />
        <ul className="space-y-16 md:space-y-20">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="grid grid-cols-[90px_1fr] gap-6 items-start">
              <div className="relative h-full w-[90px]">
                <div className="absolute left-[52px] top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-700 ring-4 ring-white/70 dark:ring-gray-800" />
                </div>
              </div>
              <div className="col-start-2 w-full h-64 rounded-2xl bg-gray-200/60 dark:bg-gray-800/50 shadow-sm" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  return (
    <>
      <div className="relative mx-auto w-full max-w-6xl">
        <div className="absolute left-[52px] top-0 bottom-0 w-[3px] bg-gradient-to-b from-orange-500 via-orange-400 to-orange-600 rounded-full" />

        <ul className="space-y-16 md:space-y-20">
          {tourpoints.map((p, i) => {
            const accent = dynamicColor(i, p.waypointtype);
            const next = tourpoints[i + 1];

            /* -------------------- START / END STATION -------------------- */
            if (
              (p.waypointtype === "start" || p.waypointtype === "end") &&
              p.pointtype === "station"
            ) {
              const colorClass =
                p.waypointtype === "start"
                  ? "bg-green-500 ring-green-300"
                  : "bg-red-500 ring-red-300";
              const hideTop = p.waypointtype === "start";
              const hideBottom = p.waypointtype === "end";
              const travelTitle =
                p.traveltype?.title || capitalize(p.traveltype?.name) || "";

              return (
                <Fragment key={p._id}>
                  <li
                    className={`grid grid-cols-[90px_1fr] gap-6 ${hideBottom ? "pb-8" : "pb-10"
                      }`}
                  >
                    <div className="relative h-full w-[90px]">
                      <div
                        className={`absolute left-[52px] w-[3px] bg-orange-500 ${hideTop ? "top-[50%]" : "top-0"
                          } ${hideBottom ? "bottom-[50%]" : "bottom-0"}`}
                      />
                      <div className="absolute left-[52px] top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div
                          className={`grid h-14 w-14 place-items-center rounded-full text-white shadow-lg ring-4 ${colorClass}`}
                        >
                          <span className="text-lg font-bold">
                            {p.waypointtype === "start" ? "S" : "E"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center mt-1">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-50 leading-tight">
                        {p.name ||
                          (p.waypointtype === "start"
                            ? "Start Station"
                            : "End Station")}
                      </h3>
                      {travelTitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("travel_mode")}: {travelTitle}
                        </p>
                      )}
                      {p.traveltime && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("duration")}: {p.traveltime}
                        </p>
                      )}
                    </div>
                  </li>

                  {next && (
                    <li className="flex items-center gap-2 ml-[78px] mt-3 text-gray-600 dark:text-gray-300">
                      <TravelConnector
                        info={next.traveltype}
                        time={next.traveltime}
                        next={next}
                      />
                    </li>
                  )}
                </Fragment>
              );
            }

            /* -------------------- LUNCH -------------------- */
            if (p.pointtype === "lunch") {
              return (
                <Fragment key={p._id}>
                  <li className="grid grid-cols-[90px_1fr] gap-6 items-start">
                    <TimelineDot
                      index={i}
                      accent={accent}
                      waypointtype={p.waypointtype}
                      hasStart={hasStart}
                    />
                    <div className="col-start-2 p-6 rounded-2xl bg-yellow-50 dark:bg-zinc-800 border border-yellow-200 dark:border-zinc-700 shadow-sm">
                      <div className="flex items-center gap-3">
                        <UtensilsCrossed className="h-6 w-6 text-orange-500" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          🍱 {p.name || t("lunch_break")}
                        </h3>
                      </div>
                      {p.traveltime && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {t("duration")}: {p.traveltime}
                        </p>
                      )}
                    </div>
                  </li>

                  {next && (
                    <li className="flex items-center gap-2 ml-[78px] mt-3 text-gray-600 dark:text-gray-300">
                      <TravelConnector
                        info={next.traveltype}
                        time={next.traveltime}
                        next={next}
                      />
                    </li>
                  )}
                </Fragment>
              );
            }

            /* -------------------- MONUMENT / PLACE -------------------- */
            const m = p.monument;
            return (
              <Fragment key={p._id}>
                <li className="grid grid-cols-[90px_1fr] gap-6 items-start">
                  <TimelineDot
                    index={i}
                    accent={accent}
                    waypointtype={p.waypointtype}
                    hasStart={hasStart}
                  />

                  <article className="relative col-start-2 w-full overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-lg transition hover:-translate-y-[2px] hover:shadow-xl">
                    {/* ⭐ CHECKED-IN BADGE (only if p.stamp exists) */}
                    {/* {!p.stamp && Object.keys(p.stamp).length > 0 && (
                      <div className="absolute top-3 right-3 z-20 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                        {t("checked_in") ?? "Checked-in"}
                      </div>
                    )} */}

                    {p.stamp && (
                      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-green-600/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {t("checked_in")}
                      </div>
                    )}

                    <div
                      className="relative w-full h-64 cursor-pointer"
                      onClick={() => handleOpen(p._id)}
                    >
                      {m?.image?.secure_url ? (
                        <Image
                          src={m.image.secure_url}
                          alt={m.name ?? ""}
                          fill
                          className="object-cover opacity-95 hover:opacity-100 transition"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-gray-200 dark:bg-gray-800">
                          <ImageIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>

                    <div className="p-6">
                      <h3
                        onClick={() => handleOpen(p._id)}
                        className="cursor-pointer text-lg font-semibold truncate hover:text-orange-500 transition"
                      >
                        {m?.title ?? m?.name ?? p.name}
                      </h3>

                      {m?.region?.title && (
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="h-5 w-5" />
                          <span>{m.region.title}</span>
                        </div>
                      )}

                      {(m?.content?.brief || m?.content?.extended) && (
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          {m?.content?.brief && (
                            <p className="line-clamp-2">
                              {m.content.brief.replace(/<[^>]+>/g, "").trim()}
                            </p>
                          )}
                          {m?.content?.extended && (
                            <p className="line-clamp-2 text-gray-500 dark:text-gray-400">
                              {m.content.extended
                                .replace(/<[^>]+>/g, "")
                                .trim()}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-5 flex gap-3">
                        <Button
                          size="sm"
                          className="flex-1 rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 font-medium border border-gray-300 dark:border-gray-700"
                          onClick={() => handleOpen(p._id)}
                        >
                          {t("tourDetails.viewDetails")}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-full border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                          onClick={async () => {
                            try {
                              /* ------------------------------------------------
                                 1️⃣ Validate User Logged In
                              ------------------------------------------------ */
                              const user =
                                persisted?.user?._id ||
                                persisted?.user?.id ||
                                persisted?.user?.uuid ||
                                null;

                              if (!user) {
                                toast.error("Please sign in to check-in");
                                return;
                              }

                              /* ------------------------------------------------
                                 2️⃣ Monument & TourPoint Validation
                              ------------------------------------------------ */
                              const monumentId = p?.monument?._id;
                              const tourpointId = p?._id;

                              if (!monumentId || !tourpointId) {
                                toast.error("Invalid point for check-in");
                                return;
                              }

                              /* ------------------------------------------------
                                 3️⃣ Create Visit History
                              ------------------------------------------------ */
                              const visitPayload: VisitHistoryPayload = {
                                user: String(user),
                                historytype: "monument",
                                monument: String(monumentId),
                                status: "active",
                                visitmode: "manual",
                                historytime: Date.now().toString(),
                              };

                              await apiCreateVisitHistory(visitPayload);

                              /* ------------------------------------------------
                                 4️⃣ Create Stamp
                              ------------------------------------------------ */
                              await apiCreateStamp({
                                monument: String(monumentId),
                                tourpoint: String(tourpointId),
                                user: String(user),
                                status: "active",
                                stamptime: Date.now(),
                              });

                              /* ------------------------------------------------
                                 5️⃣ SUCCESS Toast
                              ------------------------------------------------ */
                              toast.success(`🏅 Checked-in at ${m?.name ?? "location"}`, {
                                description: "Visit + Stamp recorded successfully",
                                duration: 5000,
                              });

                            } catch (err: any) {
                              console.error("❌ Check-in failed:", err);
                              toast.error("Check-in failed", {
                                description: err?.message || "Please try again.",
                              });
                            }
                          }}
                        >
                          <MapPin className="h-5 w-5" />
                          {t("tourDetails.checkIn")}
                        </Button>

                      </div>
                    </div>
                  </article>
                </li>

                {next && (
                  <li className="flex items-center gap-2 ml-[78px] mt-3 text-gray-600 dark:text-gray-300">
                    <TravelConnector
                      info={next.traveltype}
                      time={next.traveltime}
                      next={next}
                    />
                  </li>
                )}
              </Fragment>
            );
          })}
        </ul>
      </div>

      {/* Monument Details Modal */}
      <MonumentDetailModal
        open={!!openId}
        onClose={() => setOpenId(null)}
        loading={modalLoading}
        details={details}
        onOpenAnother={handleOpen}
        customStyle={customStyle}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
function TimelineDot({
  index,
  accent,
  waypointtype,
  hasStart,
}: {
  index: number;
  accent: string;
  waypointtype?: string;
  hasStart: boolean;
}) {
  let label: string | number = index + 1;
  if (waypointtype === "start") label = "S";
  else if (waypointtype === "end") label = "E";
  else if (hasStart) label = index;

  return (
    <div className="relative h-full w-[90px]">
      <div className="absolute left-[52px] top-0 bottom-0 w-[3px] bg-transparent" />
      <div className="absolute left-[52px] top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="grid h-14 w-14 place-items-center rounded-full text-white shadow-lg ring-4 ring-white/70 dark:ring-gray-800"
          style={{ background: accent }}
        >
          <span className="text-[13px] font-semibold">{label}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function TravelConnector({
  info,
  time,
  next,
}: {
  info?: { name?: TravelMode; title?: string };
  time?: string;
  next?: TourPoint;
}) {
  const travelMode: TravelMode = (info?.name as TravelMode) || "walk";
  const travelTitle =
    next?.pointtype === "lunch" ? "lunch_break" : info?.title || travelMode;
  const icon =
    next?.pointtype === "lunch" ? (
      <UtensilsCrossed className="h-6 w-6 text-orange-500" />
    ) : (
      getTravelIcon(travelMode)
    );
  const { t } = useLocale();

  return (
    <div className="flex items-center gap-3 text-base font-medium">
      <div className="flex items-center gap-2">
        {icon}
        <span>{t(travelTitle)}</span>
      </div>
      {time && <span className="text-sm opacity-80">• {time}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function getTravelIcon(mode?: TravelMode | string) {
  const iconSize = "h-6 w-6";
  switch (mode) {
    case "walk":
      return <Footprints className={iconSize} />;
    case "train":
      return <Train className={iconSize} />;
    case "car":
      return <Car className={iconSize} />;
    default:
      return <Footprints className={iconSize} />;
  }
}

function capitalize(str?: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function dynamicColor(i: number, type?: "start" | "place" | "end") {
  if (type === "start") return "#10b981"; // green
  if (type === "end") return "#ef4444"; // red
  return "#f97316"; // orange
}
