"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { useLocale } from "@/providers/LocaleProvider";
import type { Tour, TourPoint } from "@/lib/store/slices/touristSlice";

type Props = {
  tour: Tour;
  height?: number | string;
  profile?: "walking" | "driving" | "cycling";
};

/* -------------------- helpers -------------------- */
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
  wrapper.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const tag = el.tagName.toLowerCase();
      const name = attr.name.toLowerCase();
      const allowed = tag === "a" ? ["href"] : [];
      if (!allowed.includes(name)) el.removeAttribute(name);
    });
    if (el.tagName.toLowerCase() === "a") {
      (el as HTMLAnchorElement).target = "_blank";
      (el as HTMLAnchorElement).rel = "noopener noreferrer";
    }
  });
  const ALLOWED = new Set(["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "a"]);
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

/** Update base map label language without reloading the style */
function applyLabelLanguage(map: mapboxgl.Map, locale: "ja" | "en") {
  const style = map.getStyle();
  const layers = style?.layers || [];
  const prop = ["get", locale === "ja" ? "name_ja" : "name_en"] as any;

  for (const layer of layers) {
    if (layer.type === "symbol" && (layer.layout as any)?.["text-field"] !== undefined) {
      try {
        map.setLayoutProperty(layer.id, "text-field", prop);
      } catch {
        /* some layers may be immutable; ignore */
      }
    }
  }
}

/* -------------------- component -------------------- */
export default function MapboxTourMap({
  tour,
  height = 420,
  profile = "walking",
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { locale, t } = useLocale();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);

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
    const disposed = false; // ✅ fixed prefer-const

    (async () => {
      const mapboxglMod = await import("mapbox-gl");
      const mapboxgl = mapboxglMod.default as typeof import("mapbox-gl").default;

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setError("Missing NEXT_PUBLIC_MAPBOX_TOKEN");
        return;
      }
      mapboxgl.accessToken = token;

      const firstPoint =
        (tour.tourpoints || [])
          .map((tp) =>
            normalizeLngLat(
              (tp?.monument as any)?.location ?? (tp as any)?.location
            )
          )
          .find((p): p is [number, number] => !!p) ?? [135.75, 34.41];

      const map = new mapboxgl.Map({
        container: mapDivRef.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: firstPoint,
        zoom: 13,
        antialias: true,
      });
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      const langCtrl = new MapboxLanguage({
        defaultLanguage: locale === "ja" ? "ja" : "en",
      });
      map.addControl(langCtrl);

      map.on("style.load", () => {
        applyLabelLanguage(map, locale === "ja" ? "ja" : "en");
      });

      map.on("load", () => {
        if (disposed) return;
        setLoading(false);

        /* ---------- A) TOURPOINT MARKERS ---------- */
        clearMarkers();
        const pointPositions: [number, number][] = [];

        const points = (tour.tourpoints || []) as TourPoint[];
        let ordinal = 0;

        points.forEach((tp: TourPoint) => {
          const pos = normalizeLngLat(
            (tp?.monument as any)?.location ?? (tp as any)?.location
          );
          if (!pos) return;

          const type = String((tp as any).waypointtype ?? (tp as any).pointtype ?? "")
            .toLowerCase()
            .trim();
          const isStart = type === "start";
          const isEnd = type === "end";

          let pinEl: HTMLElement;
          let titleLabel: string;

          if (isStart) {
            pinEl = makeNumberedPin("S", colorFor("start"));
            titleLabel = pickI18n(
              (tp.monument?.title as any) ?? tp.name ?? "Start",
              locale === "ja" ? "ja" : "en"
            );
          } else if (isEnd) {
            pinEl = makeNumberedPin("E", colorFor("end"));
            titleLabel = pickI18n(
              (tp.monument?.title as any) ?? tp.name ?? "End",
              locale === "ja" ? "ja" : "en"
            );
          } else {
            ordinal += 1;
            pinEl = makeNumberedPin(String(ordinal), colorFor(type));
            titleLabel = pickI18n(
              (tp.monument?.title as any) ?? tp.name ?? `Stop ${ordinal}`,
              locale === "ja" ? "ja" : "en"
            );
          }

          const briefRaw: MaybeI18n = (tp.monument?.content as any)?.brief ?? "";
          const brief = tidyParagraphs(
            sanitizeRichHtml(pickI18n(briefRaw, locale === "ja" ? "ja" : "en"))
          );
          const img = tp.monument?.image?.secure_url
            ? `<img src="${tp.monument.image.secure_url}" alt="" class="tour-popup__img" />`
            : "";

          const chips = [
            tp.starttime ? `🕒 ${escapeText(tp.starttime)}` : "",
            tour.duration ? `⏱ ${escapeText(tour.duration)}` : "",
            tour.traveltime ? `🚶 ${escapeText(tour.traveltime)}` : "",
          ].filter(Boolean);

          const html = `
            <div class="tour-popup__card">
              ${img ? `<div class="tour-popup__media">${img}</div>` : ""}
              <div class="tour-popup__body">
                <div class="tour-popup__title">${escapeText(titleLabel)}</div>
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

          const marker = new mapboxgl.Marker({ element: pinEl }).setLngLat(pos);

          if (!isStart && !isEnd) {
            marker.setPopup(
              new mapboxgl.Popup({
                offset: 22,
                className: "tour-popup",
                closeButton: true,
                closeOnMove: false,
                maxWidth: "320px",
              }).setHTML(html)
            );
          }

          marker.addTo(map);
          markersRef.current.push(marker);
          pointPositions.push(pos);
        });

        let bounds: mapboxgl.LngLatBounds | null = null;
        if (pointPositions.length) {
          bounds = pointPositions.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(pointPositions[0], pointPositions[0])
          );
        }

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
                paint: { "line-width": 8, "line-color": "#ffffff", "line-opacity": 0.85 },
              });

              map.addLayer({
                id: "custom-route-line",
                type: "line",
                source: "custom-route",
                paint: { "line-width": 4, "line-color": "#f97316", "line-opacity": 0.95 },
              });

              const coords: [number, number][] = [];
              parsed.features?.forEach((f: any) => {
                const g = f.geometry;
                if (g?.type === "LineString" && Array.isArray(g.coordinates)) {
                  coords.push(...g.coordinates);
                } else if (g?.type === "MultiLineString") {
                  g.coordinates?.forEach((line: [number, number][]) => coords.push(...line));
                }
              });

              if (coords.length) {
                if (bounds) coords.forEach((c) => bounds!.extend(c));
                else {
                  bounds = coords.reduce(
                    (b, c) => b.extend(c),
                    new mapboxgl.LngLatBounds(coords[0], coords[0])
                  );
                }
              }
            }
          } catch (e) {
            console.error("Invalid routeJson:", e);
          }
        }

        if (bounds) {
          map.fitBounds(bounds, { padding: 56, duration: 800 });
        } else if (pointPositions.length) {
          map.fitBounds(
            pointPositions.reduce(
              (b, c) => b.extend(c),
              new mapboxgl.LngLatBounds(pointPositions[0], pointPositions[0])
            ),
            { padding: 56, duration: 800 }
          );
        } else {
          map.setCenter(firstPoint);
        }

        setTimeout(() => map.resize(), 200);
      });
    })().catch((e) => setError(String(e)));

    return () => {
      try {
        clearMarkers();
        const map = mapRef.current;
        if (map) {
          removeRouteLayers(map);
          map.remove();
        }
      } catch {}
      mapRef.current = null;
    };
  }, [tour, profile, locale]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyLabelLanguage(map, locale === "ja" ? "ja" : "en");
  }, [locale]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900"
      style={{ height }}
    >
      <div ref={mapDivRef} className="h-full w-full" />

      {loading && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3 shadow dark:bg-black/60">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            <span className="text-sm">{t("Loading map…") || "Loading map…"}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-3 top-3 rounded bg-black/70 px-3 py-2 text-xs text-white">
          {error}
        </div>
      )}

      {tour.routeImage?.secure_url && (
        <>
          <div className="absolute left-3 top-3 z-10">
            <img
              src={tour.routeImage.secure_url}
              alt="Route preview"
              className="h-24 w-36 md:h-28 md:w-44 cursor-pointer rounded-md border shadow-md hover:scale-105 transition-all object-cover"
              onClick={() => setShowImage(true)}
            />
          </div>
          {showImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setShowImage(false)}
            >
              <button
                className="absolute right-5 top-5 text-white text-2xl font-bold"
                onClick={() => setShowImage(false)}
              >
                ✕
              </button>
              <img
                src={tour.routeImage.secure_url}
                alt="Route full"
                className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg object-contain"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
