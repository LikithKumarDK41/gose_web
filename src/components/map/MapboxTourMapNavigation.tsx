"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { useLocale } from "@/providers/LocaleProvider";
import type { Tour, TourPoint } from "@/lib/store/slices/touristSlice";

/* -------------------- Helpers -------------------- */
function normalizeLngLat(
  loc?: [number, number] | { lat?: number; lng?: number } | null
): [number, number] | null {
  if (!loc) return null;
  if (Array.isArray(loc) && loc.length >= 2) {
    const [lng, lat] = loc;
    return typeof lng === "number" && typeof lat === "number" ? [lng, lat] : null;
  }
  if (typeof loc === "object") {
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

function applyLabelLanguage(map: mapboxgl.Map, locale: "ja" | "en") {
  const style = map.getStyle();
  const layers = style?.layers || [];
  const prop = ["get", locale === "ja" ? "name_ja" : "name_en"] as any;

  for (const layer of layers) {
    if (layer.type === "symbol" && (layer.layout as any)?.["text-field"] !== undefined) {
      try {
        map.setLayoutProperty(layer.id, "text-field", prop);
      } catch {
        /* ignore */
      }
    }
  }
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

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  };

  const removeRouteLayers = (map: mapboxgl.Map) => {
    ["custom-route-line", "custom-route-outline"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource("custom-route")) map.removeSource("custom-route");
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
          .map(
            (tp) =>
              normalizeLngLat(
                (tp?.monument as any)?.location ?? (tp as any)?.location
              ) || undefined
          )
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
      map.on("style.load", () => applyLabelLanguage(map, mapLocale));

      map.on("load", () => {
        if (disposed) return;
        setLoading(false);
        clearMarkers();

        const points = (tour.tourpoints || []) as TourPoint[];
        const positions: [number, number][] = [];
        let ordinal = 0;

        points.forEach((tp) => {
          const pos = normalizeLngLat(
            (tp.monument as any)?.location ?? (tp as any)?.location
          );
          if (!pos) return;

          const type = String(
            (tp as any).waypointtype ?? (tp as any).pointtype ?? ""
          ).toLowerCase();

          const isStart = type === "start";
          const isEnd = type === "end";
          const label = isStart ? "S" : isEnd ? "E" : String(++ordinal);

          const pin = makeNumberedPin(label, colorFor(type));

          // --- 🧭 popup layout same as reference ---
          const title = pickI18n(
            (tp.monument?.title as any) ?? tp.name,
            mapLocale
          );
          const briefRaw: MaybeI18n = (tp.monument?.content as any)?.brief ?? "";
          const brief = tidyParagraphs(
            sanitizeRichHtml(pickI18n(briefRaw, mapLocale))
          );
          const img = tp.monument?.image?.secure_url
            ? `<img src="${tp.monument.image.secure_url}" alt="" class="tour-popup__img" />`
            : "";
          const chips = [
            tp.starttime ? `🕒 ${escapeText(tp.starttime)}` : "",
            tour.duration ? `⏱ ${escapeText(tour.duration)}` : "",
            tour.traveltime ? `🚶 ${escapeText(tour.traveltime)}` : "",
          ].filter(Boolean);

          const popupHtml = `
            <div class="tour-popup__card">
              ${img ? `<div class="tour-popup__media">${img}</div>` : ""}
              <div class="tour-popup__body">
                <div class="tour-popup__title">${escapeText(title || "Point")}</div>
                ${
                  chips.length
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

          const marker = new mapboxgl.Marker({ element: pin })
            .setLngLat(pos)
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
          positions.push(pos);
        });

        removeRouteLayers(map);

        if (tour.routeJson) {
          try {
            const parsed = JSON.parse(tour.routeJson);
            if (parsed?.type === "FeatureCollection") {
              map.addSource("custom-route", { type: "geojson", data: parsed });
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
          } catch (e) {
            console.error("Invalid routeJson:", e);
          }
        }

        if (positions.length) {
          map.fitBounds(
            positions.reduce(
              (b, c) => b.extend(c),
              new mapboxgl.LngLatBounds(positions[0], positions[0])
            ),
            { padding: 56, duration: 800 }
          );
        }

        // 🛰️ Watch user position
        if ("geolocation" in navigator) {
          navigator.geolocation.watchPosition(
            (pos) => {
              const userPos: [number, number] = [
                pos.coords.longitude,
                pos.coords.latitude,
              ];
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
              } else {
                userMarkerRef.current.setLngLat(userPos);
              }
            },
            (err) => console.warn("GPS error:", err),
            { enableHighAccuracy: true, maximumAge: 1000 }
          );
        }
      });
    })().catch((e) => setError(String(e)));

    return () => {
      disposed = true;
      clearMarkers();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [tour, profile, mapLocale]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) applyLabelLanguage(map, mapLocale);
  }, [mapLocale]);

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
