"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { useLocale } from "@/providers/LocaleProvider";
import type { Tour, TourPoint } from "@/lib/types/userTour.types";
import type { Feature, Polygon } from "geojson";

import { useAppSelector } from "@/lib/store/hook";
import { selectUserTourPoints } from "@/lib/store/slices/navSlice";

/* -------------------- Helpers -------------------- */
function normalizeLngLat(
  loc?: [number, number] | { lat?: number; lng?: number } | null
): [number, number] | null {
  if (!loc) return null;
  if (Array.isArray(loc) && loc.length >= 2) {
    const [lng, lat] = loc;
    return typeof lng === "number" && typeof lat === "number" ? [lng, lat] : null;
  }
  if (typeof loc === "object" && loc !== null) {
    const { lat, lng } = loc as any;
    return typeof lat === "number" && typeof lng === "number" ? [lng, lat] : null;
  }
  return null;
}

function colorFor(kind?: string) {
  if (!kind) return "#f59e0b";
  const k = kind.toLowerCase();
  if (k === "start") return "#16a34a";
  if (k === "end") return "#ef4444";
  return "#f59e0b";
}

function makeNumberedPin(label: string, fill: string) {
  const el = document.createElement("div");
  el.style.width = "40px";
  el.style.height = "56px";
  el.style.transform = "translateY(-6px)";
  // el.style.position = "relative"; // needed for badge
  el.innerHTML = `
  <svg viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path d="M20 0c11 0 20 8.6 20 19.2 0 12.7-13.6 26.5-18.4 31.1a2.2 2.2 0 0 1-3.2 0C13.6 45.7 0 31.9 0 19.2 0 8.6 9 0 20 0z" fill="${fill}" />
    <circle cx="20" cy="19" r="12" fill="white"/>
    <text x="20" y="20.5" text-anchor="middle" font-size="12" font-weight="800" fill="${fill}" dominant-baseline="middle">${label}</text>
  </svg>`;
  return el;
}

function escapeText(s?: string) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type MaybeI18n = string | { ja?: string; en?: string } | undefined | null;
function pickI18n(val: MaybeI18n, locale: "ja" | "en"): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  const wanted = val[locale];
  const fallback = locale === "ja" ? val.en : val.ja;
  return (wanted ?? fallback ?? "") as string;
}

function sanitizeRichHtml(input?: string) {
  if (!input) return "";
  const wrapper = document.createElement("div");
  wrapper.innerHTML = input;
  wrapper.querySelectorAll("script, style, iframe, object, embed").forEach((n) => n.remove());
  const ALLOWED = new Set(["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li"]);
  wrapper.querySelectorAll("*").forEach((el) => {
    if (!ALLOWED.has(el.tagName.toLowerCase())) {
      const parent = el.parentNode;
      while (el.firstChild) parent?.insertBefore(el.firstChild, el);
      parent?.removeChild(el);
    }
  });
  return wrapper.innerHTML;
}

function tidyParagraphs(html: string) {
  return html.replace(/<p>\s*<\/p>/g, "").replace(/(\s*<br>\s*){3,}/g, "<br><br>");
}

function createCircle(center: [number, number], radius: number, points = 64): Feature<Polygon> {
  const coords: [number, number][] = [];
  const [lng, lat] = center;
  const earthRadius = 6378137;
  const latConv = (radius / earthRadius) * (180 / Math.PI);
  const lngConv = (radius / earthRadius) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180);

  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;
    const x = lng + Math.sin(rad) * lngConv;
    const y = lat + Math.cos(rad) * latConv;
    coords.push([x, y]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

function waitForStyle(map: mapboxgl.Map): Promise<void> {
  if (map.isStyleLoaded()) return Promise.resolve();
  return new Promise((resolve) => {
    const check = () => {
      if (map.isStyleLoaded()) {
        map.off("render", check);
        resolve();
      }
    };
    map.on("render", check);
  });
}

/* -------------------- Component -------------------- */
export default function MapboxTourMapNavigation({
  tour,
  height = "100vh",
  profile = "walking",
}: {
  tour: Tour;
  height?: number | string;
  profile?: "walking" | "driving" | "cycling";
}) {
  const { locale, t } = useLocale();
  const mapLocale: "ja" | "en" = locale === "ja" ? "ja" : "en";

  /* 🔥 REDUX Stamp Source */
  const reduxTourPoints = useAppSelector(selectUserTourPoints);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  };

  const removeRadiusLayers = (map: mapboxgl.Map) => {
    const style = map.getStyle();
    const sources = (style?.sources && Object.keys(style.sources)) || [];
    for (const srcId of sources) {
      if (!srcId.startsWith("radius-")) continue;
      try {
        if (map.getLayer(srcId)) map.removeLayer(srcId);
        if (map.getLayer(`${srcId}-outline`)) map.removeLayer(`${srcId}-outline`);
        if (map.getSource(srcId)) map.removeSource(srcId);
      } catch { }
    }
  };

  const removeRouteLayers = (map: mapboxgl.Map) => {
    try {
      if (map.getLayer("custom-route-line")) map.removeLayer("custom-route-line");
      if (map.getLayer("custom-route-outline")) map.removeLayer("custom-route-outline");
      if (map.getSource("custom-route")) map.removeSource("custom-route");
    } catch { }
    removeRadiusLayers(map);
  };

  useEffect(() => {
    let disposed = false;

    (async () => {
      const mapboxglMod = await import("mapbox-gl");
      const mapboxgl = mapboxglMod.default;

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setError("Missing NEXT_PUBLIC_MAPBOX_TOKEN");
        return;
      }

      mapboxgl.accessToken = token;

      const firstPoint =
        (tour.tourpoints || [])
          .map((tp) => normalizeLngLat((tp as any)?.monument?.location ?? (tp as any)?.location) || undefined)
          .find(Boolean) ?? [135.75, 34.41];

      const map = new mapboxgl.Map({
        container: mapDivRef.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: firstPoint as [number, number],
        zoom: 13,
        antialias: true,
      });

      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new MapboxLanguage({ defaultLanguage: mapLocale }));

      map.once("load", async () => {
        if (disposed) return;

        await waitForStyle(map);

        try {
          setLoading(false);
          clearMarkers();
          removeRouteLayers(map);

          const points = (tour.tourpoints || []) as TourPoint[];
          const positions: [number, number][] = [];
          let ordinal = 0;

          points.forEach((tp) => {
            const pos =
              normalizeLngLat(
                (tp as any)?.monument?.location ?? (tp as any)?.location
              ) || null;

            if (!pos) return;

            const wtype = String(tp.waypointtype ?? "").toLowerCase();
            const label = wtype === "start" ? "S" : wtype === "end" ? "E" : String(++ordinal);
            const pin = makeNumberedPin(label, colorFor(wtype));

            /* ---------------------- 🔥 STAMP BADGE FROM REDUX ----------------------- */
            const match = reduxTourPoints?.find(
              (u: any) =>
                String(u._id) === String(tp._id) &&
                u.stamp &&
                Object.keys(u.stamp).length > 0
            );

            const hasStamp =
              match &&
              tp.pointtype !== "station" &&
              tp.pointtype !== "lunch";

            if (hasStamp) {
              const badge = document.createElement("div");
              badge.style.position = "absolute";
              badge.style.top = "0";
              badge.style.right = "0";

              // magic alignment
              badge.style.transform = "translate(40%, -40%)";

              badge.style.background = "#16a34a";
              badge.style.color = "white";
              badge.style.width = "20px";
              badge.style.height = "20px";
              badge.style.borderRadius = "50%";
              badge.style.display = "flex";
              badge.style.alignItems = "center";
              badge.style.justifyContent = "center";
              badge.style.fontSize = "12px";
              badge.style.fontWeight = "bold";
              badge.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";
              badge.textContent = "✓";

              pin.appendChild(badge);
            }
            /* ------------------------------------------------------------------------ */

            const title = pickI18n(
              (tp.monument?.title as any) ?? tp.name,
              mapLocale
            );

            const briefRaw: MaybeI18n = (tp.monument?.content as any)?.brief ?? "";
            const brief = tidyParagraphs(
              sanitizeRichHtml(pickI18n(briefRaw, mapLocale))
            );

            const img = (tp as any)?.monument?.image?.secure_url
              ? `<img src="${(tp as any).monument.image.secure_url}" alt="" class="tour-popup__img" />`
              : "";

            const chips = [
              tp.starttime ? `🕒 ${escapeText(tp.starttime)}` : "",
              (tour as any).duration ? `⏱ ${escapeText((tour as any).duration)}` : "",
              (tour as any).traveltime ? `🚶 ${escapeText((tour as any).traveltime)}` : "",
            ].filter(Boolean);

            const popupHtml = `
              <div class="tour-popup__card">
                ${img ? `<div class="tour-popup__media">${img}</div>` : ""}
                <div class="tour-popup__body">
                  <div class="tour-popup__title">${escapeText(title || "Point")}</div>
                  ${chips.length
                ? `<div class="tour-popup__chips">${chips
                  .map((c) => `<span class="tour-chip">${c}</span>`)
                  .join("")}</div>`
                : ""
              }
                  <div class="tour-popup__brief">${brief}</div>
                </div>
              </div>
            `;

            const popup = new mapboxgl.Popup({
              offset: 25,
              closeButton: true,
              closeOnMove: false,
              className: "tour-popup",
              maxWidth: "320px",
            }).setHTML(popupHtml);

            const isStart = wtype === "start";
            const isEnd = wtype === "end";
            const isStation =
              String((tp as any)?.pointtype || "").toLowerCase() === "station";

            let marker: mapboxgl.Marker;

            if (isStart || isEnd || isStation) {
              marker = new mapboxgl.Marker({ element: pin }).setLngLat(pos).addTo(map);
            } else {
              marker = new mapboxgl.Marker({ element: pin })
                .setLngLat(pos)
                .setPopup(popup)
                .addTo(map);
            }

            markersRef.current.push(marker);
            positions.push(pos);

            const mr = (tp as any)?.monument?.georadius;
            const geoRadius = typeof mr === "number" && mr > 0 ? mr : 50;

            if (geoRadius > 0) {
              const circleFeature = createCircle(pos, geoRadius);
              const baseId =
                (tp as any).id ??
                (tp as any)._id ??
                (tp as any)?.monument?._id ??
                label;
              const srcId = `radius-${baseId}`;

              if (!map.getSource(srcId)) {
                map.addSource(srcId, { type: "geojson", data: circleFeature });
                map.addLayer({
                  id: srcId,
                  type: "fill",
                  source: srcId,
                  paint: { "fill-color": "#3b82f6", "fill-opacity": 0.15 },
                });
                map.addLayer({
                  id: `${srcId}-outline`,
                  type: "line",
                  source: srcId,
                  paint: {
                    "line-color": "#3b82f6",
                    "line-width": 1.5,
                    "line-opacity": 0.4,
                  },
                });
              } else {
                const s = map.getSource(srcId) as mapboxgl.GeoJSONSource;
                s.setData(circleFeature);
              }
            }
          });

          if (tour.routeJson) {
            try {
              const parsed = JSON.parse(tour.routeJson);
              if (parsed?.type === "FeatureCollection") {
                if (!map.getSource("custom-route")) {
                  map.addSource("custom-route", {
                    type: "geojson",
                    data: parsed,
                  });
                } else {
                  const s = map.getSource("custom-route") as mapboxgl.GeoJSONSource;
                  s.setData(parsed);
                }

                if (!map.getLayer("custom-route-outline")) {
                  map.addLayer({
                    id: "custom-route-outline",
                    type: "line",
                    source: "custom-route",
                    paint: {
                      "line-width": 8,
                      "line-color": "#fff",
                      "line-opacity": 0.8,
                    },
                  });
                }

                if (!map.getLayer("custom-route-line")) {
                  map.addLayer({
                    id: "custom-route-line",
                    type: "line",
                    source: "custom-route",
                    paint: {
                      "line-width": 4,
                      "line-color": "#f97316",
                      "line-opacity": 0.95,
                    },
                  });
                }
              }
            } catch (e) {
              console.error("Invalid routeJson:", e);
            }
          }

          if (positions.length) {
            try {
              const bounds = positions.reduce(
                (b, c) => b.extend(c),
                new mapboxgl.LngLatBounds(positions[0], positions[0])
              );
              map.fitBounds(bounds, { padding: 56, duration: 800 });
            } catch { }
          }

          if ("geolocation" in navigator && geoWatchIdRef.current == null) {
            geoWatchIdRef.current = navigator.geolocation.watchPosition(
              (pos) => {
                const userPos: [number, number] = [
                  pos.coords.longitude,
                  pos.coords.latitude,
                ];

                if (!map.isStyleLoaded()) {
                  map.once("idle", () => {
                    const el = document.createElement("div");
                    el.className = "user-marker";
                    el.style.width = "20px";
                    el.style.height = "20px";
                    el.style.borderRadius = "50%";
                    el.style.background = "#2563eb";
                    el.style.border = "3px solid white";
                    el.style.boxShadow = "0 0 6px rgba(0,0,0,0.4)";
                    userMarkerRef.current = new mapboxgl.Marker(el)
                      .setLngLat(userPos)
                      .addTo(map);
                    map.easeTo({ center: userPos, duration: 1000 });
                  });
                  return;
                }

                if (!userMarkerRef.current) {
                  const el = document.createElement("div");
                  el.className = "user-marker";
                  el.style.width = "20px";
                  el.style.height = "20px";
                  el.style.borderRadius = "50%";
                  el.style.background = "#2563eb";
                  el.style.border = "3px solid white";
                  el.style.boxShadow = "0 0 6px rgba(0,0,0,0.4)";
                  userMarkerRef.current = new mapboxgl.Marker(el)
                    .setLngLat(userPos)
                    .addTo(map);
                  map.easeTo({ center: userPos, duration: 800 });
                } else {
                  userMarkerRef.current.setLngLat(userPos);
                }
              },
              (err) => console.warn("GPS error:", err),
              { enableHighAccuracy: true, maximumAge: 1000 }
            );
          }
        } catch (e) {
          console.error(e);
          setError("Map style failed to load.");
        }
      });

    })().catch((e) => setError(String(e)));

    return () => {
      disposed = true;

      if (geoWatchIdRef.current != null) {
        try {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
        } catch { }
        geoWatchIdRef.current = null;
      }

      try {
        clearMarkers();
        const map = mapRef.current;
        if (map) {
          removeRouteLayers(map);
          map.remove();
        }
      } catch { }
      mapRef.current = null;
    };
  }, [tour, profile, mapLocale, reduxTourPoints]);


  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900"
      style={{ height }}
    >
      <div ref={mapDivRef} className="h-full w-full" />

      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-white/70 dark:bg-black/60">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
            {t("Loading map…") || "Loading map…"}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-3 top-3 rounded bg-black/80 px-3 py-2 text-xs text-white">
          {error}
        </div>
      )}
    </div>
  );
}
