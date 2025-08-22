'use client';

import React, { useEffect, useRef } from 'react';
import { useTourNav } from '@/providers/TourNavProvider';
import type { Place } from '@/lib/data/tours';

type PlaceWithCoords = Place & { lat: number; lng: number };

function hasCoords(p: Place): p is PlaceWithCoords {
  return typeof p.lat === 'number' && typeof p.lng === 'number';
}

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]), lat2 = toRad(b[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function GeofenceProvider({ children }: { children: React.ReactNode }) {
  const { status, activeTour } = useTourNav();
  const watchIdRef = useRef<number | null>(null);
  const checkedRef = useRef<Set<string>>(new Set());
  const lastFiredRef = useRef<number>(0);

  useEffect(() => {
    // Start/stop geolocation watcher based on status
    if (status !== 'running' || !activeTour?.places?.length) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    checkedRef.current ??= new Set();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;
        const now = Date.now();

        // Throttle a bit
        if (now - lastFiredRef.current < 1500) return;
        lastFiredRef.current = now;

        const geo = activeTour.places.filter(hasCoords);
        for (const p of geo) {
          const radius = Math.max(5, p.geofenceRadius ?? 30);
          const dist = haversine([lng, lat], [p.lng, p.lat]);
          if (dist <= radius && !checkedRef.current.has(p.id)) {
            checkedRef.current.add(p.id);

            window.dispatchEvent(new CustomEvent('tour:checkin', {
              detail: {
                id: p.id,
                name: p.name,
                blurb: p.blurb,
                time: p.time,
                lat: p.lat,
                lng: p.lng,
                radius,
                distance: Math.round(dist),
              },
            }));
          }
        }
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('Geofence watch error', err);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [status, activeTour]);

  return <>{children}</>;
}
