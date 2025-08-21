// src/components/map/MapboxTourMapNavigation.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import type mapboxgl from 'mapbox-gl';
import type { Place } from '@/lib/data/tours';

declare global {
  interface Window {
    __tourNavigateStart?: () => void;
    __tourNavigatePause?: () => void;
    __tourNavigateResume?: () => void;
  }
}

type Props = {
  places: Place[];
  height?: number | string;
  profile?: 'walking' | 'driving' | 'cycling';
};

type PlaceWithCoords = Place & { lat: number; lng: number };
function hasCoords(p: Place): p is PlaceWithCoords {
  return typeof p.lat === 'number' && typeof p.lng === 'number';
}

/** SVG pin with a number/letter centered inside */
function makePinMarker(label: string, color = '#2563eb', textColor = '#fff') {
  const wrapper = document.createElement('div');
  wrapper.style.width = '34px';
  wrapper.style.height = '42px';
  wrapper.style.transform = 'translateY(-2px)'; // tiny nudge
  wrapper.innerHTML = `
    <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <!-- pin body -->
      <path d="M17 1C9.27 1 3 7.27 3 15c0 9.68 12.1 26 13.04 27.29a1.2 1.2 0 0 0 1.92 0C18.9 41 31 24.68 31 15 31 7.27 24.73 1 17 1z"
            fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <!-- inner circle -->
      <circle cx="17" cy="15" r="10" fill="${color}" />
      <!-- label -->
      <text x="17" y="15" text-anchor="middle" dominant-baseline="central"
            font-size="12" font-weight="700" fill="${textColor}">
        ${label}
      </text>
    </svg>`;
  return wrapper;
}

// Golden-angle HSL → HEX: unlimited distinct colors
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
  const hue = (i * 137.508) % 360; // golden angle
  return hslToHex(hue, 70, 50);
}

// Haversine meters
function haversine(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]), lat2 = toRad(b[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Bearing fallback when heading is unavailable
function bearingFrom(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// ---- “Spiderfy” helpers for overlapping markers ----
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
  const result: [number, number][] = [];
  for (let i = 0; i < n; i++) result.push(offsetLngLat(lng, lat, radius, (360 / n) * i));
  return result;
}

export default function MapboxTourMapNavigation({
  places,
  height = '100vh',
  profile = 'walking',
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const geolocateRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const lastPosRef = useRef<[number, number] | null>(null);
  const lastFetchTsRef = useRef<number>(0);
  const followRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ distance: number; duration: number } | null>(null);

  // Camera/profile
  const FOLLOW_ZOOM = 17.5;
  const FOLLOW_PITCH = 60;
  const THROTTLE_MS = 5000;
  const THROTTLE_M = 30;

  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      if (typeof window !== 'undefined' && !window.isSecureContext && location.hostname !== 'localhost') {
        setError('Geolocation requires HTTPS (or localhost).');
      }

      const mapboxglMod = await import('mapbox-gl');
      const mapboxgl = mapboxglMod.default;
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) { setError('Missing NEXT_PUBLIC_MAPBOX_TOKEN'); return; }
      mapboxgl.accessToken = token;

      // Validate inputs
      const geoAll = (places ?? []).filter(hasCoords);
      if (geoAll.length < 2) { setError('Need at least one stop plus End'); return; }

      // Last is End (E); all before are numbered
      const end = geoAll[geoAll.length - 1];
      const numbered = geoAll.slice(0, -1);
      const endLL: [number, number] = [end.lng, end.lat];

      const first = numbered[0];
      const initialCenter: [number, number] = [first.lng, first.lat];

      // Map (navigation style for clear roads)
      const map = new mapboxgl.Map({
        container: mapDivRef.current as HTMLDivElement,
        style: 'mapbox://styles/mapbox/navigation-day-v1',
        center: initialCenter,
        zoom: FOLLOW_ZOOM,
        pitch: FOLLOW_PITCH,
        bearing: 0,
        antialias: true,
      });
      mapRef.current = map;

      // Controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
        fitBoundsOptions: { maxZoom: FOLLOW_ZOOM },
      });
      geolocateRef.current = geolocate;
      map.addControl(geolocate, 'top-right');

      // Stop auto-follow on manual interaction
      const stopFollow = () => { followRef.current = false; };
      map.on('dragstart', stopFollow);
      map.on('zoomstart', stopFollow);
      map.on('rotatestart', stopFollow);
      map.on('pitchstart', stopFollow);

      // ---- Build display points with labels/colors ----
      type DisplayPt = {
        lng: number; lat: number;
        baseLng: number; baseLat: number;
        label: string; color: string; popupHTML: string;
      };
      const displayPts: DisplayPt[] = [];

      numbered.forEach((p, idx) => {
        const label = String(idx + 1);
        const color = dynamicColor(idx);
        displayPts.push({
          lng: p.lng, lat: p.lat, baseLng: p.lng, baseLat: p.lat,
          label, color,
          popupHTML: `
            <div style="min-width:220px">
              <div style="font-weight:600;margin-bottom:4px">${label}. ${p.name}</div>
              ${p.time ? `<div style="font-size:12px;color:#666">🕒 ${p.time}</div>` : ''}
              ${p.blurb ? `<div style="font-size:13px;margin-top:6px">${p.blurb}</div>` : ''}
              ${p.image ? `<img src="${p.image}" alt="${p.name}" style="margin-top:8px;border-radius:8px;width:100%;height:auto;object-fit:cover" />` : ''}
            </div>
          `,
        });
      });

      // End point (E)
      displayPts.push({
        lng: end.lng, lat: end.lat, baseLng: end.lng, baseLat: end.lat,
        label: 'E', color: '#111827',
        popupHTML: `<div style="min-width:200px;font-weight:600">End – ${end.name ?? 'Finish'}</div>`,
      });

      // Group exact matches and spiderfy
      const keyOf = (lng: number, lat: number) => `${lng.toFixed(6)},${lat.toFixed(6)}`;
      const groups = new Map<string, DisplayPt[]>();
      for (const pt of displayPts) {
        const k = keyOf(pt.baseLng, pt.baseLat);
        const arr = groups.get(k) ?? [];
        arr.push(pt);
        groups.set(k, arr);
      }

      // Create markers (SVG pins with numbers)
      const markers: mapboxgl.Marker[] = [];
      for (const [, arr] of groups) {
        const offsets = spreadOffsets(arr[0].baseLng, arr[0].baseLat, arr.length);
        arr.forEach((pt, i) => {
          const [lng, lat] = offsets[i] ?? [pt.baseLng, pt.baseLat];
          pt.lng = lng; pt.lat = lat;

          const popup = new mapboxgl.Popup({ offset: 28, maxWidth: '320px', className: 'tour-popup' })
            .setHTML(pt.popupHTML)
            .on('open', () => {
              const el = popup.getElement();
              if (el) el.style.zIndex = '9999'; // ensure above markers
            });

          const marker = new mapboxgl.Marker({ element: makePinMarker(pt.label, pt.color, '#fff') })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);

          markers.push(marker);
        });
      }

      // ---- Route layers (white casing + blue line) ----
      const emptyLine: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {},
      };

      map.on('load', async () => {
        if (!map.getSource('tour-route')) {
          map.addSource('tour-route', { type: 'geojson', data: emptyLine });
        }
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

        // Initial static route: hk-0 → hk-1 → … → hk-10 → hk-end
        const orderedCoords: [number, number][] = [
          [first.lng, first.lat],
          ...numbered.slice(1).map(p => [p.lng, p.lat] as [number, number]),
          endLL,
        ];
        await fetchAndRenderDirections(orderedCoords, token, profile, map, setStats);

        // Fit bounds
        const b = new mapboxgl.LngLatBounds();
        orderedCoords.forEach(([lng, lat]) => b.extend([lng, lat]));
        if (!b.isEmpty()) map.fitBounds(b, { padding: 60, duration: 600, maxZoom: 16 });
      });

      // Expose direct functions (overlay can call these reliably)
      window.__tourNavigateStart  = () => { pausedRef.current = false; followRef.current = true;  geolocateRef.current?.trigger(); };
      window.__tourNavigatePause  = () => { pausedRef.current = true;  followRef.current = false; };
      window.__tourNavigateResume = () => { pausedRef.current = false; followRef.current = true;  geolocateRef.current?.trigger(); };

      // Also listen to custom events (fallback)
      const onStartEvent  = () => window.__tourNavigateStart?.();
      const onPauseEvent  = () => window.__tourNavigatePause?.();
      const onResumeEvent = () => window.__tourNavigateResume?.();

      window.addEventListener('tour:start', onStartEvent);
      window.addEventListener('tour:pause', onPauseEvent);
      window.addEventListener('tour:resume', onResumeEvent);

      // Live updates from Geolocate control
      const onGeo = async (evt: any) => {
        if (pausedRef.current) return;

        const lng = evt?.coords?.longitude ?? evt?.longitude;
        const lat = evt?.coords?.latitude ?? evt?.latitude;
        const heading = evt?.coords?.heading as number | undefined;
        if (typeof lng !== 'number' || typeof lat !== 'number') return;

        const curr: [number, number] = [lng, lat];
        const now = Date.now();
        const last = lastPosRef.current;
        const dt = now - lastFetchTsRef.current;
        const moved = last ? haversine(last, curr) : Infinity;

        if (dt < THROTTLE_MS && moved < THROTTLE_M) return;
        lastPosRef.current = curr;
        lastFetchTsRef.current = now;

        if (followRef.current) {
          const br = typeof heading === 'number' ? heading : (last ? bearingFrom(last, curr) : 0);
          map.easeTo({
            center: curr,
            zoom: FOLLOW_ZOOM,
            pitch: FOLLOW_PITCH,
            bearing: br,
            duration: 500,
            padding: { top: 80, right: 40, bottom: 220, left: 40 },
          });
        }

        const orderedFromHere: [number, number][] = [
          curr,
          ...numbered.map(p => [p.lng, p.lat] as [number, number]),
          endLL,
        ];
        await fetchAndRenderDirections(orderedFromHere, token, profile, map, setStats);
      };

      (geolocate as any).on?.('geolocate', onGeo);
      (geolocate as any).on?.('error', (e: any) => setError(e?.message || 'Geolocation error'));

      cleanup = () => {
        delete window.__tourNavigateStart;
        delete window.__tourNavigatePause;
        delete window.__tourNavigateResume;
        window.removeEventListener('tour:start', onStartEvent);
        window.removeEventListener('tour:pause', onPauseEvent);
        window.removeEventListener('tour:resume', onResumeEvent);
        (geolocate as any).off?.('geolocate', onGeo);
        (geolocate as any).off?.('error', () => {});
        markers.forEach(m => m.remove());
        map.remove();
        mapRef.current = null;
      };
    })().catch((e) => setError(String(e)));

    return () => cleanup();
  }, [places, profile]);

  const pretty = (s?: { distance: number; duration: number } | null) => {
    if (!s) return '';
    const km = (s.distance / 1000).toFixed(2);
    const mins = Math.round(s.duration / 60);
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${km} km • ${hh ? `${hh}h ` : ''}${mm}m`;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg border" style={{ height }}>
      <div ref={mapDivRef} className="h-full w-full" />
      {error && (
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/70 px-3 py-2 text-xs text-white">
          {error}
        </div>
      )}
      {stats && !error && (
        <div className="absolute right-3 top-3 rounded bg-white/90 px-3 py-2 text-xs shadow">
          Route: {pretty(stats)}
        </div>
      )}
    </div>
  );
}

// ---- Directions helper ----
async function fetchAndRenderDirections(
  waypoints: [number, number][],
  token: string,
  profile: 'walking' | 'driving' | 'cycling',
  map: mapboxgl.Map,
  setStats: (s: { distance: number; duration: number } | null) => void,
) {
  const MAX = 25;
  if (waypoints.length > MAX) {
    const res: [number, number][] = [];
    const step = (waypoints.length - 1) / (MAX - 1);
    for (let i = 0; i < MAX; i++) {
      const idx = Math.round(i * step);
      res.push(waypoints[Math.min(idx, waypoints.length - 1)]);
    }
    waypoints = res;
  }

  const coordsParam = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordsParam}` +
    `?alternatives=false&geometries=geojson&overview=full&access_token=${token}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Directions API ${res.status}`);
    const data = await res.json() as {
      routes: { geometry: GeoJSON.LineString; distance: number; duration: number }[];
    };
    const route = data.routes?.[0];
    if (!route) throw new Error('No route');

    (map.getSource('tour-route') as mapboxgl.GeoJSONSource).setData({
      type: 'Feature',
      geometry: route.geometry,
      properties: {},
    });
    setStats({ distance: route.distance, duration: route.duration });
  } catch {
    (map.getSource('tour-route') as mapboxgl.GeoJSONSource).setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: waypoints },
      properties: {},
    });
  }
}
