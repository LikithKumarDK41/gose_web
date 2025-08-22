'use client';

// Extend Window interface to include __tourNavigateStart, __tourNavigatePause, __tourNavigateResume
declare global {
    interface Window {
        __tourNavigateStart?: () => void;
        __tourNavigatePause?: () => void;
        __tourNavigateResume?: () => void;
    }
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Place } from '@/lib/data/tours';

type NavStatus = 'idle' | 'running' | 'paused';
type Profile = 'walking' | 'driving' | 'cycling';

type ActiveTour = {
    id: string;
    profile: Profile;
    places: Place[];
};

type Ctx = {
    status: NavStatus;
    activeTour?: ActiveTour;
    start: (tourId: string, places: Place[], profile?: Profile) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
};

const TourNavContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = 'tourNavState';

export default function TourNavProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<NavStatus>('idle');
    const [activeTour, setActiveTour] = useState<ActiveTour | undefined>(undefined);

    // Restore from sessionStorage to persist across route changes / reloads
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as { status: NavStatus; activeTour?: ActiveTour };
                setStatus(parsed.status);
                setActiveTour(parsed.activeTour);
            }
        } catch {
            // ignore restore errors
        }
    }, []);

    // Persist
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ status, activeTour }));
        } catch {
            // ignore persist errors
        }
    }, [status, activeTour]);

    // Helper: broadcast status to interested components
    const broadcastStatus = useCallback((s: NavStatus) => {
        window.dispatchEvent(new CustomEvent('tournav:status', { detail: { status: s } }));
    }, []);

    const start = useCallback((tourId: string, places: Place[], profile: Profile = 'walking') => {
        const withGeo = places.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number');
        setActiveTour({ id: tourId, profile, places: withGeo });
        setStatus('running');
        broadcastStatus('running');

        // Tell any map(s) to start geolocating
        if (typeof window.__tourNavigateStart === 'function') {
            window.__tourNavigateStart();
        } else {
            window.dispatchEvent(new CustomEvent('tour:start'));
        }
    }, [broadcastStatus]);

    const pause = useCallback(() => {
        setStatus('paused');
        broadcastStatus('paused');
        if (typeof window.__tourNavigatePause === 'function') {
            window.__tourNavigatePause();
        } else {
            window.dispatchEvent(new CustomEvent('tour:pause'));
        }
    }, [broadcastStatus]);

    const resume = useCallback(() => {
        if (!activeTour) return;
        setStatus('running');
        broadcastStatus('running');
        if (typeof window.__tourNavigateResume === 'function') {
            window.__tourNavigateResume();
        } else {
            window.dispatchEvent(new CustomEvent('tour:resume'));
        }
    }, [activeTour, broadcastStatus]);

    const stop = useCallback(() => {
        setStatus('idle');
        setActiveTour(undefined);
        broadcastStatus('idle');
        // Optional: could broadcast a 'tour:stop' here
    }, [broadcastStatus]);

    const value = useMemo<Ctx>(() => ({
        status, activeTour, start, pause, resume, stop,
    }), [status, activeTour, start, pause, resume, stop]);

    return <TourNavContext.Provider value={value}>{children}</TourNavContext.Provider>;
}

export function useTourNav(): Ctx {
    const ctx = useContext(TourNavContext);
    if (!ctx) throw new Error('useTourNav must be used within TourNavProvider');
    return ctx;
}
