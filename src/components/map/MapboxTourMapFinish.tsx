"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { useLocale } from "@/providers/LocaleProvider";
import type { Tour, TourPoint } from "@/lib/types/userTour.types";

/* -------------------- props -------------------- */
type Props = {
  tour: Tour;
  stampedPoints: TourPoint[]; // ⭐ NEW
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

/* -------------------- component -------------------- */
export default function MapboxTourMap({
  tour,
  stampedPoints,
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

  /* ---------------- MAIN EFFECT ---------------- */
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
          .map((tp) =>
            normalizeLngLat(
              (tp?.monument as any)?.location ?? (tp as any)?.location
            )
          )
          .find(Boolean) ?? [135.75, 34.41];

      const map = new mapboxgl.Map({
        container: mapDivRef.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: firstPoint,
        zoom: 13,
        antialias: true,
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new MapboxLanguage({ defaultLanguage: locale === "ja" ? "ja" : "en" }));

      map.on("load", () => {
        if (disposed) return;

        setLoading(false);
        clearMarkers();

        const points = tour.tourpoints || [];
        const positions: [number, number][] = [];
        let ordinal = 0;

        /* ---- detect start/end ---- */
        const start = points.find((tp) =>
          String((tp as any).waypointtype ?? tp.pointtype).toLowerCase() === "start"
        );
        const end = points.find((tp) =>
          String((tp as any).waypointtype ?? tp.pointtype).toLowerCase() === "end"
        );

        const startPos = normalizeLngLat(
          (start as any)?.monument?.location ?? (start as any)?.location
        );
        const endPos = normalizeLngLat(
          (end as any)?.monument?.location ?? (end as any)?.location
        );

        const samePlace =
          startPos &&
          endPos &&
          Math.abs(startPos[0] - endPos[0]) < 0.00001 &&
          Math.abs(startPos[1] - endPos[1]) < 0.00001;

        /* -------------------- MARKERS -------------------- */
        points.forEach((tp: TourPoint) => {
          let pos = normalizeLngLat(
            (tp as any)?.monument?.location ?? (tp as any)?.location
          );
          if (!pos) return;

          const type = String((tp as any).waypointtype ?? tp.pointtype ?? "")
            .toLowerCase()
            .trim();

          if (samePlace && type === "end") {
            pos = [pos[0] + 0.0001, pos[1] + 0.0001];
          }

          const isStart = type === "start";
          const isEnd = type === "end";

          /* ---- numbering ---- */
          let pinEl: HTMLElement;
          if (isStart) pinEl = makeNumberedPin("S", colorFor("start"));
          else if (isEnd) pinEl = makeNumberedPin("E", colorFor("end"));
          else pinEl = makeNumberedPin(String(++ordinal), colorFor(type));

          /* ----------------------------
           ⭐ ADD STAMP BADGE HERE
          ----------------------------- */
          const isStamped = stampedPoints.some(
            (sp) =>
              String(sp._id) === String(tp._id) &&
              sp.stamp &&
              Object.keys(sp.stamp).length > 0 &&
              tp.pointtype !== "station" &&
              tp.pointtype !== "lunch"
          );

          if (isStamped) {
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
            pinEl.appendChild(badge);
          }

          /* ----- popup ----- */
          const title = pickI18n((tp.monument?.title as any) ?? tp.name, locale === "ja" ? "ja" : "en");

          const briefRaw = (tp.monument?.content as any)?.brief;
          const brief = tidyParagraphs(
            sanitizeRichHtml(
              pickI18n(briefRaw, locale === "ja" ? "ja" : "en")
            )
          );

          const img = tp.monument?.image?.secure_url
            ? `<img src="${tp.monument.image.secure_url}" class="tour-popup__img" />`
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
                <div class="tour-popup__title">${escapeText(title)}</div>
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
          positions.push(pos);

          /* -------------------------------------------------------
        ⭐ PLACE ONE EXTRA END MARKER AT STAMPED END POSITION
     -------------------------------------------------------- */
          const stampedEndPoint = stampedPoints.find((sp) => {
            return String((sp as any).waypointtype ?? "")
              .toLowerCase()
              .trim() === "end";
          });

          const stampedEndPos = stampedEndPoint
            ? normalizeLngLat(
              (stampedEndPoint as any)?.monument?.location ??
              (stampedEndPoint as any)?.location
            )
            : null;

          if (stampedEndPos) {
            const nearPos: [number, number] = [
              stampedEndPos[0] + 0.0002,
              stampedEndPos[1] + 0.0002,
            ];

            const extraPin = makeNumberedPin("E", colorFor("end"));

            const extraMarker = new mapboxgl.Marker({ element: extraPin })
              .setLngLat(nearPos)
              .addTo(map);

            markersRef.current.push(extraMarker);
          }
        });

        /* -------------------- ROUTE -------------------- */
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
                  "line-color": "#ffffff",
                  "line-opacity": 0.85,
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
          } catch (err) {
            console.error("Invalid routeJson:", err);
          }
        }

        /* ---- Fit bounds ---- */
        if (positions.length) {
          const bounds = positions.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(positions[0], positions[0])
          );
          map.fitBounds(bounds, { padding: 56, duration: 800 });
        }

        setTimeout(() => map.resize(), 200);
      });
    })().catch((e) => setError(String(e)));

    return () => {
      disposed = true;
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
  }, [tour, profile, locale, stampedPoints]);

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
            <span className="text-sm">{t("Loading map…")}</span>
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
