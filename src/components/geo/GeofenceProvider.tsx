// src/components/geo/GeofenceProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { tours } from '@/lib/data/tours';
import type { Place, Tour } from '@/lib/data/tours';

declare global {
    interface Window {
        __geofenceProviderActive?: boolean;
    }
}

type PlaceWithCoords = Place & { lat: number; lng: number };
function hasCoords(p: Place): p is PlaceWithCoords {
    return typeof p.lat === 'number' && typeof p.lng === 'number';
}

type Fence = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number; // meters
    tourId: Tour['id'];
    time?: string;
    blurb?: string;
};

function metersBetween(a: [number, number], b: [number, number]) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLng = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]), lat2 = toRad(b[1]);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}

export default function GeofenceProvider() {
    const watchIdRef = useRef<number | null>(null);
    const runningRef = useRef(false);
    const pausedRef = useRef(false);
    const checkedRef = useRef<Set<string>>(new Set());

    // Build all fences once
    const fencesRef = useRef<Fence[]>((() => {
        const out: Fence[] = [];
        for (const t of tours) {
            for (const p of t.places) {
                if (!hasCoords(p)) continue;
                out.push({
                    id: p.id,
                    name: p.name,
                    lat: p.lat,
                    lng: p.lng,
                    radius: Math.max(5, p.geofenceRadius ?? 30),
                    tourId: t.id,
                    time: p.time,
                    blurb: p.blurb,
                });
            }
        }
        return out;
    })());

    useEffect(() => {
        // prevent double-mount
        if (window.__geofenceProviderActive) return;
        window.__geofenceProviderActive = true;

        const onPos: PositionCallback = (pos) => {
            if (!runningRef.current || pausedRef.current) return;
            const curr: [number, number] = [pos.coords.longitude, pos.coords.latitude];

            for (const f of fencesRef.current) {
                if (checkedRef.current.has(f.id)) continue;
                const d = metersBetween(curr, [f.lng, f.lat]);
                if (d <= f.radius) {
                    checkedRef.current.add(f.id);
                    window.dispatchEvent(
                        new CustomEvent('tour:checkin', {
                            detail: {
                                id: f.id,
                                name: f.name,
                                blurb: f.blurb,
                                time: f.time,
                                lat: f.lat,
                                lng: f.lng,
                                radius: f.radius,
                                distance: Math.round(d),
                                tourId: f.tourId,
                            },
                        })
                    );
                }
            }
        };

        const onErr: PositionErrorCallback = () => { };

        const start = () => {
            if (runningRef.current) return;
            runningRef.current = true;
            pausedRef.current = false;
            if ('geolocation' in navigator && watchIdRef.current == null) {
                watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
                    enableHighAccuracy: true,
                    maximumAge: 1000,
                    timeout: 10000,
                });
            }
        };
        const pause = () => { pausedRef.current = true; };
        const resume = () => { pausedRef.current = false; start(); };
        const stop = () => {
            runningRef.current = false;
            pausedRef.current = false;
            if (watchIdRef.current != null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };

        // Control via events used by your overlay / anywhere else
        const onStartEvt = () => start();
        const onPauseEvt = () => pause();
        const onResumeEvt = () => resume();

        window.addEventListener('tour:start', onStartEvt);
        window.addEventListener('tour:pause', onPauseEvt);
        window.addEventListener('tour:resume', onResumeEvt);

        // Clean up
        return () => {
            stop();
            window.removeEventListener('tour:start', onStartEvt);
            window.removeEventListener('tour:pause', onPauseEvt);
            window.removeEventListener('tour:resume', onResumeEvt);
            delete window.__geofenceProviderActive;
        };
    }, []);

    return null;
}
