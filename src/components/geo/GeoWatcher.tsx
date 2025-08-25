'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import { selectNav } from '@/lib/store/slices/navSlice';
import { selectTours } from '@/lib/store/slices/toursSlice';
import { enqueue, markChecked, selectGeofenceChecked } from '@/lib/store/slices/geofenceSlice';

type Fence = {
    id: string; name: string; lat: number; lng: number; radius: number;
    tourId: string; time?: string; blurb?: string;
};

const metersBetween = (a: [number, number], b: [number, number]) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLng = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]), lat2 = toRad(b[1]);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
};

export default function GeoWatcher() {
    const dispatch = useAppDispatch();
    const nav = useAppSelector(selectNav);
    const tours = useAppSelector(selectTours);
    const checked = useAppSelector(selectGeofenceChecked);

    const watchIdRef = useRef<number | null>(null);

    const fences = useMemo<Fence[]>(() => {
        const out: Fence[] = [];
        for (const t of tours) {
            for (const p of t.places) {
                if (typeof (p as any).lat === 'number' && typeof (p as any).lng === 'number') {
                    out.push({
                        id: p.id, name: p.name, lat: (p as any).lat, lng: (p as any).lng,
                        radius: Math.max(5, p.geofenceRadius ?? 30),
                        tourId: t.id, time: p.time, blurb: p.blurb,
                    });
                }
            }
        }
        return out;
    }, [tours]);

    useEffect(() => {
        const start = () => {
            if (!('geolocation' in navigator)) return;
            if (watchIdRef.current != null) return;
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    if (nav.status !== 'running') return;
                    const curr: [number, number] = [pos.coords.longitude, pos.coords.latitude];

                    for (const f of fences) {
                        if (checked[f.id]) continue;
                        const d = metersBetween(curr, [f.lng, f.lat]);
                        if (d <= f.radius) {
                            dispatch(markChecked(f.id));
                            dispatch(enqueue({
                                id: f.id, name: f.name, lat: f.lat, lng: f.lng,
                                radius: f.radius, distance: Math.round(d),
                                tourId: f.tourId, blurb: f.blurb, time: f.time,
                            }));
                        }
                    }
                },
                () => { },
                { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
            );
        };

        const stop = () => {
            if (watchIdRef.current != null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };

        if (nav.status === 'running') start(); else stop();
        return () => stop();
    }, [nav.status, fences, checked, dispatch]);

    return null;
}
