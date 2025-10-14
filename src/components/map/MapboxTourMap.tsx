"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { useLocale } from "@/providers/LocaleProvider";

/* -------------------- types -------------------- */
type Tourpoint = {
  _id?: string;
  name?: string;
  pointtype?: string;
  waypointtype?: "start" | "place" | "end" | string;
  starttime?: string;
  monument?: {
    _id?: string;
    title?: string;
    name?: string;
    location?: [number, number] | { lat?: number; lng?: number };
    image?: { secure_url?: string };
    content?: { brief?: string; extended?: string };
  };
};

type Tour = {
  _id?: string;
  title?: string;
  duration?: string;
  traveltime?: string;
  content?: { brief?: string; extended?: string };
  tourpoints?: Tourpoint[];
  routeJson?: string;
  routeImage?: { secure_url?: string };
};

type PlaceWithCoords = {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lng: number;
  time?: string;
  blurb?: string;
  image?: string;
  extended?: string;
};

type Props = {
  tour: Tour;
  height?: number | string;
  profile?: "walking" | "driving" | "cycling";
};

/* -------------------- helpers -------------------- */
function dynamicColor(kind?: "start" | "place" | "end") {
  if (kind === "start") return "hsl(150 70% 40%)"; // green
  if (kind === "end") return "hsl(0 75% 50%)"; // red
  return "hsl(30 90% 50%)"; // orange
}

function makeNumberedFlag(label: string, color = "#f97316") {
  const wrapper = document.createElement("div");
  wrapper.style.width = "48px";
  wrapper.style.height = "60px";
  wrapper.innerHTML = `
    <svg viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6v48" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M10 6h26l-6.5 10 6.5 10H10z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="31" cy="11" r="8.5" fill="white" stroke="${color}" stroke-width="2.5"/>
      <text 
        x="31" 
        y="12" 
        text-anchor="middle" 
        font-size="12" 
        font-weight="800" 
        fill="${color}" 
        dominant-baseline="middle"
      >${label}</text>
    </svg>`;
  return wrapper;
}

/* -------------------- component -------------------- */
export default function MapboxTourMap({
  tour,
  height = 420,
  profile = "walking",
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const { locale, t } = useLocale();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    let cleanup = () => {};

    (async () => {
      const mapboxglMod = await import("mapbox-gl");
      const mapboxgl = mapboxglMod.default as typeof import("mapbox-gl").default;

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setError("Missing NEXT_PUBLIC_MAPBOX_TOKEN");
        return;
      }
      mapboxgl.accessToken = token;

      const points = tour.tourpoints ?? [];
      const normalized: PlaceWithCoords[] = points.reduce(
        (acc: PlaceWithCoords[], tp, i) => {
          const loc = tp.monument?.location;
          let lat: number | null = null;
          let lng: number | null = null;
          if (Array.isArray(loc)) {
            lng = loc[0];
            lat = loc[1];
          } else if (loc && typeof loc === "object") {
            lat = loc.lat ?? null;
            lng = loc.lng ?? null;
          }
          if (lat == null || lng == null) return acc;
          acc.push({
            id: tp._id ?? String(i),
            name: tp.monument?.title ?? tp.name ?? `Point ${i + 1}`,
            kind: tp.waypointtype ?? tp.pointtype ?? "place",
            lat,
            lng,
            time: tp.starttime ?? "",
            blurb: tp.monument?.content?.brief ?? "",
            extended: tp.monument?.content?.extended ?? "",
            image: tp.monument?.image?.secure_url ?? "",
          });
          return acc;
        },
        []
      );

      const center: [number, number] =
        normalized.length > 0
          ? [Number(normalized[0].lng), Number(normalized[0].lat)]
          : [135.75, 34.41];

      const map = new mapboxgl.Map({
        container: mapDivRef.current!,
        style: "mapbox://styles/mapbox/streets-v11",
        center: center,
        zoom: 13,
        antialias: true,
      });
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("style.load", () => {
        const lang = new MapboxLanguage({
          defaultLanguage: locale === "ja" ? "ja" : "en",
        });
        map.addControl(lang);
      });

      map.on("load", () => {
        setLoading(false);
        setTimeout(() => map.resize(), 500);
      });

      /* -------------------- Route + Markers -------------------- */
      if (tour.routeJson) {
        try {
          const parsed = JSON.parse(tour.routeJson);
          if (parsed && parsed.type === "FeatureCollection") {
            map.on("load", () => {
              if (!map.getSource("custom-route")) {
                map.addSource("custom-route", { type: "geojson", data: parsed });
                map.addLayer({
                  id: "custom-route-outline",
                  type: "line",
                  source: "custom-route",
                  paint: {
                    "line-width": 8,
                    "line-color": "#ffffff",
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

              const allCoords: [number, number][] = [];
              parsed.features.forEach((f: any) => {
                if (f.geometry?.coordinates?.length)
                  allCoords.push(...f.geometry.coordinates);
              });

              if (allCoords.length) {
                const startCoord = allCoords[0];
                const endCoord = allCoords[allCoords.length - 1];

                /* 🟢🟥 Show Start & End flags (side by side if same) */
                const [startLng, startLat] = startCoord;
                const [endLng, endLat] = endCoord;
                const overlap =
                  Math.abs(startLng - endLng) < 0.00005 &&
                  Math.abs(startLat - endLat) < 0.00005;

                if (overlap) {
                  const offsetMeters = 0.0001; // ~11m
                  const startOffset: [number, number] = [
                    startLng - offsetMeters,
                    startLat,
                  ];
                  const endOffset: [number, number] = [
                    endLng + offsetMeters,
                    endLat,
                  ];

                  new mapboxgl.Marker({
                    element: makeNumberedFlag("S", "green"),
                  })
                    .setLngLat(startOffset)
                    .setPopup(
                      new mapboxgl.Popup({ offset: 25 }).setHTML("<b>Start Point</b>")
                    )
                    .addTo(map);

                  new mapboxgl.Marker({
                    element: makeNumberedFlag("E", "red"),
                  })
                    .setLngLat(endOffset)
                    .setPopup(
                      new mapboxgl.Popup({ offset: 25 }).setHTML("<b>End Point</b>")
                    )
                    .addTo(map);
                } else {
                  new mapboxgl.Marker({
                    element: makeNumberedFlag("S", "green"),
                  })
                    .setLngLat(startCoord)
                    .setPopup(
                      new mapboxgl.Popup({ offset: 25 }).setHTML("<b>Start Point</b>")
                    )
                    .addTo(map);

                  new mapboxgl.Marker({
                    element: makeNumberedFlag("E", "red"),
                  })
                    .setLngLat(endCoord)
                    .setPopup(
                      new mapboxgl.Popup({ offset: 25 }).setHTML("<b>End Point</b>")
                    )
                    .addTo(map);
                }

                /* 🟠 Intermediate waypoints */
                (tour.tourpoints || []).forEach((tp, idx) => {
                  const loc = tp.monument?.location;
                  if (!loc) return;
                  const lat = Array.isArray(loc)
                    ? loc[1]
                    : typeof loc === "object"
                    ? loc.lat
                    : null;
                  const lng = Array.isArray(loc)
                    ? loc[0]
                    : typeof loc === "object"
                    ? loc.lng
                    : null;
                  if (lat == null || lng == null) return;

                  const color = dynamicColor(tp.waypointtype as any);
                  new mapboxgl.Marker({
                    element: makeNumberedFlag(String(idx + 1), color),
                  })
                    .setLngLat([lng, lat])
                    .setPopup(
                      new mapboxgl.Popup({ offset: 25 }).setHTML(
                        `<b>${tp.name}</b><br>${tp.monument?.content?.brief || ""}`
                      )
                    )
                    .addTo(map);
                });

                /* Fit bounds */
                const bounds = allCoords.reduce(
                  (b, [lng, lat]) => b.extend([lng, lat]),
                  new mapboxgl.LngLatBounds(allCoords[0], allCoords[0])
                );
                map.fitBounds(bounds, { padding: 50, duration: 800 });
              }
            });
          }
        } catch (err) {
          console.error("Invalid routeJson:", err);
        }
      }

      cleanup = () => {
        map.remove();
        mapRef.current = null;
      };
    })().catch((e) => setError(String(e)));

    return () => cleanup();
  }, [tour, profile]);

  /* -------------------- Locale change -------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = map.getStyle().layers;
    layers?.forEach((layer) => {
      if (layer.type === "symbol" && layer.layout && "text-field" in layer.layout) {
        map.setLayoutProperty(
          layer.id,
          "text-field",
          ["get", locale === "ja" ? "name_ja" : "name_en"]
        );
      }
    });
  }, [locale]);

  /* -------------------- Render -------------------- */
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900"
      style={{ height }}
    >
      <div ref={mapDivRef} className="h-full w-full" />

      {/* Loader */}
      {loading && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3 shadow dark:bg-black/60">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            <span className="text-sm">{t("Loading map…") || "Loading map…"}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute left-3 top-3 rounded bg-black/70 px-3 py-2 text-xs text-white">
          {error}
        </div>
      )}

      {/* Route Image thumbnail */}
      {tour.routeImage?.secure_url && (
        <div className="absolute left-3 top-3 z-10">
          <img
            src={tour.routeImage.secure_url}
            alt="Route preview"
            className="h-24 w-36 md:h-28 md:w-44 cursor-pointer rounded-md border shadow-md hover:scale-105 transition-all object-cover"
            onClick={() => setShowImage(true)}
          />
        </div>
      )}

      {/* Fullscreen Image */}
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
            src={tour.routeImage?.secure_url}
            alt="Route full"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
