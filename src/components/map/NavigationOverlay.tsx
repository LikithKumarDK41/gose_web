'use client';

import { Button } from "@/components/ui/button";
import { Play, Pause, ArrowLeft, CheckCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalLoader } from "@/components/system/LoaderProvider";
import { useEffect, useState } from "react";

type NavState = 'idle' | 'running' | 'paused';

type CheckinDetail = {
    id: string;
    name: string;
    blurb?: string;
    time?: string;
    lat: number;
    lng: number;
    radius: number;   // meters
    distance: number; // meters at trigger time
};

export default function NavigationOverlay() {
    const router = useRouter();
    const { show } = useGlobalLoader();
    const [state, setState] = useState<NavState>('idle');

    // Check-in banner state
    const [checkin, setCheckin] = useState<CheckinDetail | null>(null);

    useEffect(() => {
        const onCheckin = (e: Event) => {
            const ce = e as CustomEvent<CheckinDetail>;
            setCheckin(ce.detail);
        };
        window.addEventListener('tour:checkin', onCheckin);
        return () => window.removeEventListener('tour:checkin', onCheckin);
    }, []);

    const handleStart = () => {
        // Prefer direct function if available (robust across hydration timing)
        if (typeof window.__tourNavigateStart === 'function') {
            window.__tourNavigateStart();
        } else {
            window.dispatchEvent(new CustomEvent("tour:start"));
        }
        setState('running');
    };

    const handlePauseResume = () => {
        if (state === 'running') {
            if (typeof window.__tourNavigatePause === 'function') {
                window.__tourNavigatePause();
            } else {
                window.dispatchEvent(new CustomEvent("tour:pause"));
            }
            setState('paused');
        } else if (state === 'paused') {
            if (typeof window.__tourNavigateResume === 'function') {
                window.__tourNavigateResume();
            } else {
                window.dispatchEvent(new CustomEvent("tour:resume"));
            }
            setState('running');
        }
    };

    const handleBack = () => {
        show();
        requestAnimationFrame(() => router.back());
    };

    const renderBottomButton = () => {
        if (state === 'idle') {
            return (
                <Button
                    size="lg"
                    className="pointer-events-auto rounded-full px-6 shadow-lg"
                    onClick={handleStart}
                    aria-label="Start navigation"
                >
                    <Play className="mr-2 h-5 w-5" />
                    Start
                </Button>
            );
        }
        if (state === 'running') {
            return (
                <Button
                    size="lg"
                    variant="outline"
                    className="pointer-events-auto rounded-full px-6 shadow-lg"
                    onClick={handlePauseResume}
                    aria-label="Pause navigation"
                >
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                </Button>
            );
        }
        // paused
        return (
            <Button
                size="lg"
                className="pointer-events-auto rounded-full px-6 shadow-lg"
                onClick={handlePauseResume}
                aria-label="Resume navigation"
            >
                <Play className="mr-2 h-5 w-5" />
                Resume
            </Button>
        );
    };

    return (
        <>
            {/* Top-left Back button */}
            <div className="fixed left-3 top-3 z-[60]">
                <Button
                    size="icon"
                    className="rounded-full shadow"
                    onClick={handleBack}
                    aria-label="Back"
                    title="Back"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </div>

            {/* Bottom-centered control (Start / Pause / Resume) */}
            <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center">
                {renderBottomButton()}
            </div>

            {/* Check-in banner (appears when entering a geofence) */}
            {checkin && (
                <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
                    <div className="max-w-md w-full rounded-xl border bg-white/95 p-4 shadow-lg backdrop-blur">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold">
                                    You’re near: {checkin.name}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    {checkin.blurb ?? 'You’ve entered the check-in area.'}
                                </div>
                                <div className="mt-1 text-[11px] text-muted-foreground">
                                    ~{checkin.distance} m inside • radius {checkin.radius} m
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() => {
                                            // Here you could also POST a check-in, mark progress, etc.
                                            setCheckin(null);
                                        }}
                                    >
                                        Check in
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full"
                                        onClick={() => setCheckin(null)}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                            <button
                                className="ml-2 rounded-full p-1 hover:bg-black/5"
                                aria-label="Close"
                                onClick={() => setCheckin(null)}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
