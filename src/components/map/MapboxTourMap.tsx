'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import type mapboxgl from 'mapbox-gl';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import type { Place } from '@/lib/data/tourTypes';
import { useLocale } from '@/providers/LocaleProvider';

type Props = {
  places: Place[];
  height?: number | string;
  profile?: 'walking' | 'driving' | 'cycling';
};

/* -------------------- helpers -------------------- */
type PlaceWithCoords = Place & { lat: number; lng: number };
function hasCoords(p: Place): p is PlaceWithCoords {
  return typeof p.lat === 'number' && typeof p.lng === 'number';
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function dynamicColor(i: number) {
  const hue = (i * 137.508) % 360;
  return hslToHex(hue, 70, 50);
}

function makePinMarker(label: string, color = '#2563eb', textColor = '#fff') {
  const wrapper = document.createElement('div');
  wrapper.style.width = '34px';
  wrapper.style.height = '42px';
  wrapper.style.transform = 'translateY(-2px)';
  wrapper.innerHTML = `
    <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <path d="M17 1C9.27 1 3 7.27 3 15c0 9.68 12.1 26 13.04 27.29a1.2 1.2 0 0 0 1.92 0C18.9 41 31 24.68 31 15 31 7.27 24.73 1 17 1z"
            fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="17" cy="15" r="10" fill="${color}" />
      <text x="17" y="15" text-anchor="middle" dominant-baseline="central"
            font-size="12" font-weight="700" fill="${textColor}">${label}</text>
    </svg>`;
  return wrapper;
}

function offsetLngLat(lng: number, lat: number, meters: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  const dNorth = Math.cos(rad) * meters;
  const dEast = Math.sin(rad) * meters;
  const dLat = dNorth / 111111;
  const dLng = dEast / (111111 * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

function spreadOffsets(lng: number, lat: number, n: number): [number, number][] {
  if (n <= 1) return [[lng, lat]];
  const base = 12;
  const radius = base + Math.min(40, (n - 1) * 2);
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) out.push(offsetLngLat(lng, lat, radius, (360 / n) * i));
  return out;
}

function orderByKind(all: PlaceWithCoords[]) {
  const starts = all.filter(p => p.kind === 'start');
  const ends = all.filter(p => p.kind === 'end');
  const mids = all.filter(p => p.kind !== 'start' && p.kind !== 'end');

  const start = starts[0] ?? mids[0] ?? ends[0];
  const end = ends[0];

  const rest = all.filter(p => p !== start && p !== end && p.kind !== 'end');
  const ordered = [start, ...rest, ...(end ? [end] : [])].filter(Boolean) as PlaceWithCoords[];

  return { ordered, start, end, rest };
}

function safeSetRouteData(map: mapboxgl.Map, geometry: GeoJSON.LineString) {
  if (!map.isStyleLoaded()) {
    map.once('load', () => safeSetRouteData(map, geometry));
    return;
  }
  let src = map.getSource('tour-route') as mapboxgl.GeoJSONSource | undefined;
  if (!src) {
    map.addSource('tour-route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
    });
    if (!map.getLayer('tour-route-casing')) {
      map.addLayer({
        id: 'tour-route-casing',
        type: 'line',
        source: 'tour-route',
        paint: { 'line-width': 10, 'line-color': '#ffffff', 'line-opacity': 0.9 },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      });
    }
    if (!map.getLayer('tour-route-line')) {
      map.addLayer({
        id: 'tour-route-line',
        type: 'line',
        source: 'tour-route',
        paint: { 'line-width': 6, 'line-color': '#2563eb', 'line-opacity': 0.95 },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      });
    }
    src = map.getSource('tour-route') as mapboxgl.GeoJSONSource;
  }
  src.setData({ type: 'Feature', geometry, properties: {} });
}

/* -------------------- component -------------------- */

export default function MapboxTourMap({ places, height = 420, profile = 'walking' }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const { locale, t } = useLocale();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ distance: number; duration: number } | null>(null);

  useEffect(() => {
    let cleanup = () => { };

    (async () => {
      const mapboxglMod = await import('mapbox-gl');
      const mapboxgl = mapboxglMod.default as typeof import('mapbox-gl').default;

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) { setError('Missing NEXT_PUBLIC_MAPBOX_TOKEN'); return; }
      mapboxgl.accessToken = token;

      const withCoords = places.filter(hasCoords);
      if (!withCoords.length) { setError('No places with coordinates'); return; }

      const { ordered, start, end } = orderByKind(withCoords);
      const initialCenter: [number, number] = start ? [start.lng, start.lat] : [withCoords[0].lng, withCoords[0].lat];

      const map = new mapboxgl.Map({
        container: mapDivRef.current!,
        style: 'mapbox://styles/mapbox/streets-v11', // ✅ multilingual style
        center: initialCenter,
        zoom: 13,
        antialias: true,
      });
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // --- apply language plugin AFTER style load ---
      map.on('style.load', () => {
        const lang = new MapboxLanguage({ defaultLanguage: locale });
        map.addControl(lang);
      });

      map.on('load', () => setLoading(false));

      // --- Marker & popup setup ---
      const displayPts: any[] = [];
      let seq = 1;
      const makePopupHTML = (p: PlaceWithCoords, label: string) => `
        <div style="min-width:250px; font-family:Arial, sans-serif;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:16px;">${label} – ${p.name}</strong>
            <button onclick="this.closest('.mapboxgl-popup').remove()"
                    style="background:#111827;color:#fff;border:none;padding:2px 6px;border-radius:4px;font-size:12px;cursor:pointer;">
              ✕
            </button>
          </div>
          ${p.time ? `<div style="font-size:12px;color:#666;margin-top:4px;">🕒 ${p.time}</div>` : ''}
          ${p.blurb ? `<div style="font-size:13px;margin-top:6px;">${p.blurb}</div>` : ''}
          ${p.image ? `<img src="${p.image}" alt="${p.name}" style="margin-top:8px;border-radius:8px;width:100%;height:auto;object-fit:cover" />` : ''}
        </div>
      `;

      if (start) displayPts.push({ baseLng: start.lng, baseLat: start.lat, lng: start.lng, lat: start.lat, label: String(seq++), color: dynamicColor(0), popupHTML: makePopupHTML(start, 'Start') });
      ordered.forEach((p) => {
        if (p === start || p.kind === 'end') return;
        displayPts.push({ baseLng: p.lng, baseLat: p.lat, lng: p.lng, lat: p.lat, label: String(seq++), color: dynamicColor(seq), popupHTML: makePopupHTML(p, String(seq)) });
      });
      if (end) displayPts.push({ baseLng: end.lng, baseLat: end.lat, lng: end.lng, lat: end.lat, label: 'E', color: '#111827', popupHTML: makePopupHTML(end, 'End') });

      const keyOf = (lng: number, lat: number) => `${lng.toFixed(6)},${lat.toFixed(6)}`;
      const groups = new Map<string, typeof displayPts>();
      for (const pt of displayPts) {
        const k = keyOf(pt.baseLng, pt.baseLat);
        const arr = groups.get(k) ?? [];
        arr.push(pt);
        groups.set(k, arr);
      }

      const markers: mapboxgl.Marker[] = [];
      for (const [, arr] of groups) {
        const offsets = spreadOffsets(arr[0].baseLng, arr[0].baseLat, arr.length);
        arr.forEach((pt, i) => {
          const [lng, lat] = offsets[i] ?? [pt.baseLng, pt.baseLat];
          pt.lng = lng; pt.lat = lat;
          const popup = new mapboxgl.Popup({ offset: 28, maxWidth: '320px', closeButton: false, className: 'tour-popup' })
            .setHTML(pt.popupHTML);
          const marker = new mapboxgl.Marker({ element: makePinMarker(pt.label, pt.color, '#fff') })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);
          markers.push(marker);
        });
      }

      // --- Route setup ---
      const emptyLine: GeoJSON.Feature<GeoJSON.LineString> = { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} };
      let waypoints: [number, number][] = ordered.map(p => [p.lng, p.lat]);
      const MAX = 25;
      if (waypoints.length > MAX) {
        const res: [number, number][] = [];
        const step = (waypoints.length - 1) / (MAX - 1);
        for (let i = 0; i < MAX; i++) res.push(waypoints[Math.min(Math.round(i * step), waypoints.length - 1)]);
        waypoints = res;
      }

      if (waypoints.length >= 2) {
        const coordsParam = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordsParam}?alternatives=false&geometries=geojson&overview=full&access_token=${token}`;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Directions API ${res.status}`);
          const data = await res.json() as { routes: { geometry: GeoJSON.LineString; distance: number; duration: number }[] };
          const route = data.routes?.[0];
          if (route) {
            safeSetRouteData(map, route.geometry);
            setStats({ distance: route.distance, duration: route.duration });
            const b = new mapboxgl.LngLatBounds();
            route.geometry.coordinates.forEach(([lng, lat]) => b.extend([lng, lat]));
            if (!b.isEmpty()) map.fitBounds(b, { padding: 60, duration: 600, maxZoom: 16 });
          } else {
            safeSetRouteData(map, { type: 'LineString', coordinates: waypoints });
          }
        } catch {
          safeSetRouteData(map, { type: 'LineString', coordinates: waypoints });
        }
      } else if (!map.getSource('tour-route')) map.addSource('tour-route', { type: 'geojson', data: emptyLine });

      cleanup = () => { markers.forEach(m => m.remove()); map.remove(); mapRef.current = null; };
    })().catch(e => setError(String(e)));

    return () => cleanup();
  }, [places, profile, locale]);

  const pretty = (s?: { distance: number; duration: number } | null) => {
    if (!s) return '';
    const km = (s.distance / 1000).toFixed(2);
    const mins = Math.round(s.duration / 60);
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${km} km • ${hh ? `${hh}h ` : ''}${mm}m`;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900" style={{ height }}>
      <div ref={mapDivRef} className="h-full w-full" />
      {loading && <div className="absolute inset-0 grid place-items-center">
        <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3 shadow dark:bg-black/60">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          <span className="text-sm">{t('Loading map…') || 'Loading map…'}</span>
        </div>
      </div>}
      {error && <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/70 px-3 py-2 text-xs text-white">{error}</div>}
      {stats && !error && <div className="absolute right-3 top-3 rounded bg-white/90 px-3 py-2 text-xs shadow dark:bg-black/70 dark:text-white">
        Route: {pretty(stats)}
      </div>}
    </div>
  );
}
