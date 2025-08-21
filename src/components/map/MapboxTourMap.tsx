// src/components/map/MapboxTourMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import type mapboxgl from 'mapbox-gl';
import type { Place } from '@/lib/data/tours';

type Props = {
  places: Place[];
  height?: number | string;   // ⬅️ allow "100vh"
  profile?: 'walking' | 'driving' | 'cycling';
};

// Only places with numeric coords
type PlaceWithCoords = Place & { lat: number; lng: number };
function hasCoords(p: Place): p is PlaceWithCoords {
  return typeof p.lat === 'number' && typeof p.lng === 'number';
}

// Geolocation with timeout
function getCurrentPosition(opts?: PositionOptions, timeoutMs = 8000) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Geolocation timeout')), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve(pos); },
      (err) => { clearTimeout(timer); reject(err); },
      opts
    );
  });
}

// Generate infinite distinct colors via golden-angle HSL -> HEX
function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
function dynamicColor(index: number) {
  const golden = 137.508; // golden angle in degrees
  const hue = (index * golden) % 360;
  return hslToHex(hue, 70, 50); // vivid-ish
}

export default function MapboxTourMap({
  places,
  height = 420,
  profile = 'walking',
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ distance: number; duration: number } | null>(null); // meters, seconds

  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      const mapboxglMod = await import('mapbox-gl');
      const mapboxgl = mapboxglMod.default;

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) { setError('Missing NEXT_PUBLIC_MAPBOX_TOKEN'); return; }
      mapboxgl.accessToken = token;

      const geoPlaces = (places ?? []).filter(hasCoords);

      // ---------- resolve START (entry point) before creating the map ----------
      // Default to first place; else a BLR fallback
      let start: [number, number] =
        geoPlaces.length ? [geoPlaces[0].lng, geoPlaces[0].lat] : ([77.5946, 12.9716] as [number, number]);

      // Prefer device location if available (entry = current location)
      if ('geolocation' in navigator) {
        try {
          const pos = await getCurrentPosition({ enableHighAccuracy: true });
          start = [pos.coords.longitude, pos.coords.latitude];
        } catch { /* keep fallback */ }
      }

      // ---------- create map centered on ENTRY POINT ----------
      const map = new mapboxgl.Map({
        container: mapDivRef.current as HTMLDivElement,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: start,        // 👈 initial center = entry point
        zoom: geoPlaces.length ? 13 : 11,
      });
      mapRef.current = map;

      // Controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
          fitBoundsOptions: { maxZoom: 15 },
        }),
        'top-right'
      );

      // ------- START MARKER (distinct red pin) -------
      const startMarker = new mapboxgl.Marker({ color: '#ef4444' }) // red
        .setLngLat(start)
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText('Start'))
        .addTo(map);

      // ------- OTHER PLACE MARKERS (dynamic-color pins) -------
      const placeMarkers: mapboxgl.Marker[] = [];
      geoPlaces.forEach((p, idx) => {
        const color = dynamicColor(idx); // any N
        const marker = new mapboxgl.Marker({ color })
          .setLngLat([p.lng, p.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 16 }).setHTML(`
              <div style="min-width:200px">
                <div style="font-weight:600;margin-bottom:4px">${idx + 1}. ${p.name}</div>
                ${p.time ? `<div style="font-size:12px;color:#666">🕒 ${p.time}</div>` : ''}
                ${p.blurb ? `<div style="font-size:13px;margin-top:6px">${p.blurb}</div>` : ''}
                ${p.image ? `<img src="${p.image}" alt="${p.name}" style="margin-top:8px;border-radius:8px;width:100%;height:auto;object-fit:cover" />` : ''}
              </div>
            `)
          )
          .addTo(map);
        placeMarkers.push(marker);
      });

      // ------- DIRECTIONS (route map: start → places → start) -------
      const tourCoords = geoPlaces.map<[number, number]>((p) => [p.lng, p.lat]);

      // Closed loop waypoints
      let waypoints: [number, number][] =
        tourCoords.length > 0 ? [start, ...tourCoords, start] : [start, start];

      // Mapbox Directions API limit (25 coords)
      const MAX_WAYPOINTS = 25;
      if (waypoints.length > MAX_WAYPOINTS) {
        const keep = (arr: [number, number][], max: number) => {
          const res: [number, number][] = [];
          const step = (arr.length - 1) / (max - 1);
          for (let i = 0; i < max; i++) {
            const idx = Math.round(i * step);
            res.push(arr[Math.min(idx, arr.length - 1)]);
          }
          return res;
        };
        waypoints = keep(waypoints, MAX_WAYPOINTS);
      }

      const coordsParam = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordsParam}?alternatives=false&geometries=geojson&overview=full&access_token=${token}`;

      const emptyLine: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] },
        properties: {},
      };

      map.on('load', async () => {
        // Route layer
        if (!map.getSource('tour-route')) {
          map.addSource('tour-route', { type: 'geojson', data: emptyLine });
        }
        if (!map.getLayer('tour-route-line')) {
          map.addLayer({
            id: 'tour-route-line',
            type: 'line',
            source: 'tour-route',
            paint: {
              'line-width': 5,
              'line-color': '#2563eb', // blue route
              'line-opacity': 0.95,
            },
            layout: { 'line-join': 'round', 'line-cap': 'round' },
          });
        }

        // Fetch directions
        try {
          const res = await fetch(directionsUrl);
          if (!res.ok) throw new Error(`Directions API ${res.status}`);
          const data = await res.json() as {
            routes: { geometry: GeoJSON.LineString; distance: number; duration: number }[];
          };
          const route = data.routes?.[0];
          if (!route) throw new Error('No route found');

          (map.getSource('tour-route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            geometry: route.geometry,
            properties: {},
          });

          setStats({ distance: route.distance, duration: route.duration });

          // Optionally fit bounds to the route AFTER first render
          const bounds = new mapboxgl.LngLatBounds();
          route.geometry.coordinates.forEach(([lng, lat]) => bounds.extend([lng, lat]));
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 16 });
          }
        } catch {
          // Fallback to straight lines (still centered initially at start)
          (map.getSource('tour-route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: waypoints },
            properties: {},
          });

          const fbounds = new mapboxgl.LngLatBounds();
          waypoints.forEach(([lng, lat]) => fbounds.extend([lng, lat]));
          if (!fbounds.isEmpty()) {
            map.fitBounds(fbounds, { padding: 60, duration: 600, maxZoom: 16 });
          }
        }
      });

      // Cleanup
      cleanup = () => {
        placeMarkers.forEach((m) => m.remove());
        startMarker.remove();
        map.remove();
        mapRef.current = null;
      };
    })().catch((e) => setError(String(e)));

    return () => cleanup();
  }, [places, profile]);

  // Small formatter for stats
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
