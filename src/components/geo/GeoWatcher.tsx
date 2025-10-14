'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import { selectNav } from '@/lib/store/slices/navSlice';
import { locationTick } from '@/lib/store/slices/geofenceSlice';
import { makeSelectTourPreferringDetail } from '@/lib/store/slices/touristSlice';
import { toast } from 'sonner';

/* -------------------- Types -------------------- */
type NormalizedPlace = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number;
    blurb?: string;
};

/* -------------------- Constants -------------------- */
const DEFAULT_RADIUS = 500; // meters if monument.georadius is not defined
const TICK_THROTTLE_MS = 1500; // reduce battery drain

/* -------------------- Component -------------------- */
export default function GeoWatcher() {
    const dispatch = useAppDispatch();
    const nav = useAppSelector(selectNav);

    // stable selector instance for current tour
    const selectById = useMemo(() => makeSelectTourPreferringDetail(), []);
    const tour = useAppSelector((state) =>
        nav.activeTourId ? selectById(state, nav.activeTourId) : null
    );

    const watchIdRef = useRef<number | null>(null);
    const lastSentRef = useRef<number>(0);

    const clearWatch = useCallback(() => {
        if (watchIdRef.current != null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    /* -------------------- Normalize Tourpoints → Places -------------------- */
    const places: NormalizedPlace[] = useMemo(() => {
        if (!tour?.tourpoints?.length) return [];

        return tour.tourpoints.reduce<NormalizedPlace[]>((acc, tp, i) => {
            const loc = tp.monument?.location;
            let lat: number | null = null;
            let lng: number | null = null;

            if (Array.isArray(loc)) {
                lng = Number(loc[0]);
                lat = Number(loc[1]);
            } else if (loc && typeof loc === 'object') {
                lat = loc.lat ?? null;
                lng = loc.lng ?? null;
            }

            if (lat == null || lng == null) return acc;

            // ✅ use monument.georadius if available, else fallback
            const radius =
                tp.monument?.georadius && tp.monument.georadius > 0
                    ? tp.monument.georadius
                    : DEFAULT_RADIUS;

            acc.push({
                id: tp._id ?? String(i),
                name: tp.monument?.title ?? tp.name ?? `Point ${i + 1}`,
                lat,
                lng,
                radius,
                blurb: tp.monument?.content?.brief ?? undefined,
            });

            return acc;
        }, []);
    }, [tour]);

    /* -------------------- Start / Stop GPS Watch -------------------- */
    useEffect(() => {
        // Only run when navigation is running and we have places
        if (nav.status !== 'running' || !tour || places.length === 0) {
            clearWatch();
            return;
        }

        if (!('geolocation' in navigator)) {
            toast.error('Geolocation not supported in this browser.');
            return;
        }

        try {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const now = Date.now();
                    if (now - lastSentRef.current < TICK_THROTTLE_MS) return;
                    lastSentRef.current = now;

                    const { latitude, longitude } = pos.coords;

                    // 🛰️ Fire a geofence location tick
                    dispatch(
                        locationTick({
                            lat: latitude,
                            lng: longitude,
                            places: places.map((p) => ({
                                id: p.id,
                                name: p.name,
                                lat: p.lat,
                                lng: p.lng,
                                radius: p.radius ?? DEFAULT_RADIUS,
                                blurb: p.blurb,
                                tourId: nav.activeTourId ?? null,
                            })),
                            tourId: nav.activeTourId ?? null,
                        })
                    );
                },
                (err) => {
                    // Handle permission/timeout/etc gracefully
                    if (err.code === err.PERMISSION_DENIED) {
                        toast.error('Location permission denied. Navigation cannot run in background.');
                    } else {
                        toast.error(`Geolocation error: ${err.message}`);
                    }
                    clearWatch();
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 2000,
                    timeout: 10000,
                }
            );
        } catch (e: any) {
            toast.error(`Failed to start location watch: ${e?.message || e}`);
        }

        return () => clearWatch();
    }, [dispatch, nav.status, nav.activeTourId, places, tour, clearWatch]);

    /* -------------------- Pause / Stop Cleanup -------------------- */
    useEffect(() => {
        if (nav.status === 'paused' || nav.status === 'idle') {
            clearWatch();
        }
    }, [nav.status, clearWatch]);

    return null;
}
