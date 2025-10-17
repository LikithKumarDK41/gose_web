"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { useLocale } from "@/providers/LocaleProvider";
import type { Tour, TourPoint } from "@/lib/store/slices/touristSlice";

/* -------------------- Props -------------------- */
type Props = {
  tour: Tour;
  height?: number | string;
  profile?: "walking" | "driving" | "cycling";
};

/* -------------------- Helpers -------------------- */
function normalizeLngLat(
  loc?: [number, number] | { lat?: number; lng?: number } | null
): [number, number] | null {
  if (!loc) return null;
  if (Array.isArray(loc)) return [Number(loc[0]), Number(loc[1])];
  if (typeof loc === "object" && loc.lat != null && loc.lng != null)
    return [Number(loc.lng), Number(loc.lat)];
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
  el.innerHTML = `
  <svg viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 0c11 0 20 8.6 20 19.2 0 12.7-13.6 26.5-18.4 31.1a2.2 2.2 0 0 1-3.2 0C13.6 45.7 0 31.9 0 19.2 0 8.6 9 0 20 0z" fill="${fill}" />
    <circle cx="20" cy="19" r="12" fill="white"/>
    <text x="20" y="20.5" text-anchor="middle" font-size="12" font-weight="800" fill="${fill}" dominant-baseline="middle">${label}</text>
  </svg>`;
  el.style.width = "40px";
  el.style.height = "56px";
  return el;
}

function applyLabelLanguage(map: mapboxgl.Map, locale: "ja" | "en") {
  const style = map.getStyle();
  if (!style?.layers) return;
  const prop = ["get", locale === "ja" ? "name_ja" : "name_en"] as any;
  style.layers.forEach((layer) => {
    if (layer.type === "symbol" && (layer.layout as any)?.["text-field"]) {
      try {
        map.setLayoutProperty(layer.id, "text-field", prop);
      } catch {
        /* ignore */
      }
    }
  });
}

/* -------------------- Component -------------------- */
export default function MapboxTourMapNavigation({
  tour,
  height = "100vh",
  profile = "walking",
}: Props) {
  const { locale, t } = useLocale();
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
      map.addControl(
        new MapboxLanguage({ defaultLanguage: locale === "ja" ? "ja" : "en" })
      );

      map.on("style.load", () => applyLabelLanguage(map, locale));

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
          ); // ✅ fixed from let → const
          if (!pos) return;

          const type = String(
            (tp as any).waypointtype ?? (tp as any).pointtype ?? ""
          ).toLowerCase();

          const isStart = type === "start";
          const isEnd = type === "end";

          const label = isStart ? "S" : isEnd ? "E" : String(++ordinal);

          const pin = makeNumberedPin(label, colorFor(type));
          const marker = new mapboxgl.Marker({ element: pin })
            .setLngLat(pos)
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
              parsed.features?.forEach((f: any) => {
                const g = f.geometry;
                if (g?.type === "LineString") {
                  positions.push(...g.coordinates);
                } else if (g?.type === "MultiLineString") {
                  g.coordinates?.forEach((c: [number, number][]) =>
                    positions.push(...c)
                  );
                }
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
              map.easeTo({ center: userPos, duration: 1000 });
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
  }, [tour, profile, locale]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) applyLabelLanguage(map, locale);
  }, [locale]);

  return (
    <div
      className="relative w-full overflow-hidden border bg-gray-50 dark:bg-gray-900"
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
