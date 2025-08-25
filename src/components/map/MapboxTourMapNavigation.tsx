'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import type mapboxgl from 'mapbox-gl';
import type { Place } from '@/lib/data/tourTypes';
import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import { selectNav, setStats as setNavStats } from '@/lib/store/slices/navSlice';

/* -------------------- props & types -------------------- */

type Props = {
  places: Place[];
  height?: number | string;
  profile?: 'walking' | 'driving' | 'cycling';
};

type PlaceWithCoords = Place & { lat: number; lng: number };
const hasCoords = (p: Place): p is PlaceWithCoords =>
  typeof (p as any).lat === 'number' && typeof (p as any).lng === 'number';

type GeolocateEventLike = {
  coords?: { longitude: number; latitude: number; heading?: number | null };
  longitude?: number;
  latitude?: number;
  heading?: number | null;
};
type GeoCtrl = {
  on: (ev: 'geolocate' | 'error', cb: (e: GeolocateEventLike | Error) => void) => void;
  off?: (ev: 'geolocate' | 'error', cb: (e: GeolocateEventLike | Error) => void) => void;
  trigger?: () => void;
};

/* -------------------- helpers -------------------- */

// Distinct dynamic color
function dynamicColor(i: number) {
  const hue = (i * 137.508) % 360;
  const h = hue, s = 70 / 100, l = 50 / 100, k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l), f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/** SVG pin with a number/letter inside */
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

// Haversine meters
const haversine = (a: [number, number], b: [number, number]) => {
  const R = 6371000, toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b[1] - a[1]), dLng = toRad(b[0] - a[0]), lat1 = toRad(a[1]), lat2 = toRad(b[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
// Bearing fallback when heading is unavailable
const bearingFrom = (a: [number, number], b: [number, number]) => {
  const toRad = (d: number) => d * Math.PI / 180, toDeg = (r: number) => r * 180 / Math.PI;
  const dLng = toRad(b[0] - a[0]), lat1 = toRad(a[1]), lat2 = toRad(b[1]);
  const y = Math.sin(dLng) * Math.cos(lat2), x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

// Spiderfy helpers for overlapping markers
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

// Order by kind: start → places → end (robust if kind is missing)
function orderByKind(all: PlaceWithCoords[]) {
  const starts = all.filter(p => p.kind === 'start');
  const ends = all.filter(p => p.kind === 'end');
  const mids = all.filter(p => p.kind !== 'start' && p.kind !== 'end');

  const start = starts[0] ?? all[0] ?? null;
  const end = ends[0] ?? (all.length > 1 ? all[all.length - 1] : null);
  const middle = all.filter(p => p !== start && p !== end);
  const ordered = [start, ...middle, end].filter(Boolean) as PlaceWithCoords[];
  return { ordered, start, end };
}

/* ---- safe route setter (prevents setData on undefined source) ---- */
function safeSetRouteData(map: mapboxgl.Map, geometry: GeoJSON.LineString) {
  const ensure = () => {
    if (!map.getSource('tour-route')) {
      map.addSource('tour-route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
      });
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
  };
  if (!map.isStyleLoaded()) {
    map.once('load', () => { ensure(); safeSetRouteData(map, geometry); });
    return;
  }
  ensure();
  (map.getSource('tour-route') as mapboxgl.GeoJSONSource).setData({ type: 'Feature', geometry, properties: {} });
}

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

    safeSetRouteData(map, route.geometry);
    setStats({ distance: route.distance, duration: route.duration });
  } catch {
    // Fallback: draw straight polyline between waypoints
    safeSetRouteData(map, { type: 'LineString', coordinates: waypoints });
  }
}

/* -------------------- component -------------------- */

export default function MapboxTourMapNavigation({
  places,
  height = '100vh',
  profile = 'walking',
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const geolocateRef = useRef<mapboxgl.GeolocateControl | null>(null);

  // runtime refs that update without re-render
  const lastPosRef = useRef<[number, number] | null>(null);
  const lastFetchTsRef = useRef(0);
  const runningRef = useRef(false);          // mirrors nav.status === 'running'

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const nav = useAppSelector(selectNav);
  const dispatch = useAppDispatch();

  // Camera/profile
  const FOLLOW_ZOOM = 17.5;
  const FOLLOW_PITCH = 60;
  const THROTTLE_MS = 5000;
  const THROTTLE_M = 30;

  /* ---- keep map full width on container growth ---- */
  useEffect(() => {
    if (!mapDivRef.current) return;
    const el = mapDivRef.current;
    let raf: number | null = null;
    const resize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => mapRef.current?.resize());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ---- build the map (once per places/profile change) ---- */
  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      const geoAll = (places ?? []).filter(hasCoords);
      if (geoAll.length < 2) { setError('Need at least one stop plus End'); return; }

      const mapboxglMod = await import('mapbox-gl');
      const mapboxgl = mapboxglMod.default;
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) { setError('Missing NEXT_PUBLIC_MAPBOX_TOKEN'); return; }
      mapboxgl.accessToken = token;

      // order by kind
      const { ordered, start, end } = orderByKind(geoAll);
      const endLL: [number, number] | null = end ? [end.lng, end.lat] : null;
      const initialCenter: [number, number] = start ? [start.lng, start.lat] : [ordered[0].lng, ordered[0].lat];

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

      map.on('load', () => setLoading(false));
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
        fitBoundsOptions: { maxZoom: FOLLOW_ZOOM },
      });
      geolocateRef.current = geolocate;
      map.addControl(geolocate, 'top-right');

      // Stop auto-follow on manual interaction (we only follow while running)
      const stopFollow = () => { /* runningRef controls follow; no extra state needed */ };
      map.on('dragstart', stopFollow);
      map.on('zoomstart', stopFollow);
      map.on('rotatestart', stopFollow);
      map.on('pitchstart', stopFollow);

      /* ---------- Pins with labels (1..N and E) + spiderfy ---------- */
      type DisplayPt = {
        baseLng: number; baseLat: number;
        lng: number; lat: number;
        label: string; color: string; popupHTML: string;
      };
      const displayPts: DisplayPt[] = [];
      let seq = 1;

      // START → "1"
      if (start) {
        displayPts.push({
          baseLng: start.lng, baseLat: start.lat,
          lng: start.lng, lat: start.lat,
          label: String(seq++),
          color: dynamicColor(0),
          popupHTML: `
            <div style="min-width:220px">
              <div style="font-weight:600;margin-bottom:4px">Start – ${start.name}</div>
              ${start.time ? `<div style="font-size:12px;color:#666">🕒 ${start.time}</div>` : ''}
              ${start.blurb ? `<div style="font-size:13px;margin-top:6px">${start.blurb}</div>` : ''}
              ${start.image ? `<img src="${start.image}" alt="${start.name}" style="margin-top:8px;border-radius:8px;width:100%;height:auto;object-fit:cover" />` : ''}
            </div>
          `,
        });
      }

      // middle places → 2..N
      ordered.forEach((p) => {
        if ((start && p.id === start.id) || (end && p.id === end.id)) return;
        const idxForColor = seq - 1;
        displayPts.push({
          baseLng: p.lng, baseLat: p.lat,
          lng: p.lng, lat: p.lat,
          label: String(seq++),
          color: dynamicColor(idxForColor),
          popupHTML: `
            <div style="min-width:220px">
              <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
              ${p.time ? `<div style="font-size:12px;color:#666">🕒 ${p.time}</div>` : ''}
              ${p.blurb ? `<div style="font-size:13px;margin-top:6px">${p.blurb}</div>` : ''}
              ${p.image ? `<img src="${p.image}" alt="${p.name}" style="margin-top:8px;border-radius:8px;width:100%;height:auto;object-fit:cover" />` : ''}
            </div>
          `,
        });
      });

      // END → "E"
      if (end) {
        displayPts.push({
          baseLng: end.lng, baseLat: end.lat,
          lng: end.lng, lat: end.lat,
          label: 'E',
          color: '#111827',
          popupHTML: `<div style="min-width:200px;font-weight:600">End – ${end.name}</div>`,
        });
      }

      // group exact matches to spiderfy
      const keyOf = (lng: number, lat: number) => `${lng.toFixed(6)},${lat.toFixed(6)}`;
      const groups = new Map<string, DisplayPt[]>();
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

          const popup = new mapboxgl.Popup({ offset: 28, maxWidth: '320px', className: 'tour-popup' })
            .setHTML(pt.popupHTML);

          const marker = new mapboxgl.Marker({ element: makePinMarker(pt.label, pt.color, '#fff') })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);

          markers.push(marker);
        });
      }

      /* ---------- Base (static) route once map is loaded ---------- */
      map.on('load', async () => {
        const baseWaypoints: [number, number][] = ordered.map(p => [p.lng, p.lat]);
        const activeProfile = nav.profile ?? profile;
        await fetchAndRenderDirections(baseWaypoints, token, activeProfile, map, (s) => dispatch(setNavStats(s)));

        // Fit the planned path
        const b = new mapboxgl.LngLatBounds();
        baseWaypoints.forEach(([lng, lat]) => b.extend([lng, lat]));
        if (!b.isEmpty()) map.fitBounds(b, { padding: 60, duration: 600, maxZoom: 16 });
      });

      /* ---------- Live updates from Geolocate control ---------- */
      const onGeo = async (evt: GeolocateEventLike) => {
        if (!runningRef.current) return;

        const lng = evt?.coords?.longitude ?? evt?.longitude;
        const lat = evt?.coords?.latitude ?? evt?.latitude;
        const heading = (evt?.coords?.heading ?? evt?.heading) ?? undefined;
        if (typeof lng !== 'number' || typeof lat !== 'number') return;

        const curr: [number, number] = [lng, lat];

        const now = Date.now();
        const last = lastPosRef.current;
        const dt = now - lastFetchTsRef.current;
        const moved = last ? haversine(last, curr) : Infinity;
        if (dt < THROTTLE_MS && moved < THROTTLE_M) return;

        lastPosRef.current = curr;
        lastFetchTsRef.current = now;

        // Follow camera while running
        const br = typeof heading === 'number' ? heading : (last ? bearingFrom(last, curr) : 0);
        map.easeTo({
          center: curr,
          zoom: FOLLOW_ZOOM,
          pitch: FOLLOW_PITCH,
          bearing: br,
          duration: 500,
          padding: { top: 80, right: 40, bottom: 220, left: 40 },
        });

        // Build a "from here" route → remaining places → end
        const remaining = ordered.filter(p => !start || p.id !== start.id); // keep all after start
        const orderedFromHere: [number, number][] = [
          curr,
          ...remaining.map(p => [p.lng, p.lat] as [number, number]),
        ];
        const activeProfile = nav.profile ?? profile;
        await fetchAndRenderDirections(orderedFromHere, token!, activeProfile, map, (s) => dispatch(setNavStats(s)));
      };

      const geoCtrl = geolocate as unknown as GeoCtrl;
      const handleGeo = (e: GeolocateEventLike | Error) => { if (!(e instanceof Error)) void onGeo(e); };
      const handleGeoErr = (e: GeolocateEventLike | Error) => setError((e as Error)?.message ?? 'Geolocation error');

      geoCtrl.on('geolocate', handleGeo);
      geoCtrl.on('error', handleGeoErr);

      // cleanup
      cleanup = () => {
        geoCtrl.off?.('geolocate', handleGeo);
        geoCtrl.off?.('error', handleGeoErr);
        markers.forEach(m => m.remove());
        map.remove();
        mapRef.current = null;
      };
    })().catch(e => setError(String(e)));

    return () => cleanup();
    // IMPORTANT: don't rebuild the entire map on pause/resume → do NOT include nav.status
  }, [places, nav.profile, profile, dispatch]);

  /* ---- react to pause / resume without rebuilding the map ---- */
  useEffect(() => {
    runningRef.current = (nav.status === 'running');

    // When switching to running, kick geolocation so Mapbox starts firing
    if (nav.status === 'running') {
      const ctrl = geolocateRef.current as unknown as GeoCtrl | null;
      ctrl?.trigger?.();

      // fallback kick (browser geolocation) after a tick
      const t = setTimeout(() => {
        if (!mapRef.current) return;
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const e: GeolocateEventLike = {
                coords: {
                  longitude: pos.coords.longitude,
                  latitude: pos.coords.latitude,
                  heading: pos.coords.heading ?? null,
                },
              };
              // manually feed one reading to our handler
              const ctrl = geolocateRef.current as unknown as GeoCtrl | null;
              // Our onGeo listens on Mapbox control, but we can nudge by calling trigger; this
              // fallback just ensures at least one update comes quickly.
              // (Mapbox will continue after first trigger)
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
          );
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [nav.status]);

  /* -------------------- UI -------------------- */
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
            <span className="text-sm">Loading map…</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/70 px-3 py-2 text-xs text-white">
          {error}
        </div>
      )}
    </div>
  );
}
