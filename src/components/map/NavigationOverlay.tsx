// src/components/map/NavigationOverlay.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Play, Pause, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalLoader } from "@/components/system/LoaderProvider";
import { useEffect, useState } from "react";

type NavState = 'idle' | 'running' | 'paused';

export default function NavigationOverlay() {
    const router = useRouter();
    const { show } = useGlobalLoader();
    const [state, setState] = useState<NavState>('idle');

    // Prefer direct function calls (set by MapboxTourMapNavigation), else dispatch events
    const callOrDispatch = (fnName: '__tourNavigateStart' | '__tourNavigatePause' | '__tourNavigateResume', evtName: 'tour:start' | 'tour:pause' | 'tour:resume') => {
        if (typeof window !== 'undefined' && typeof (window as any)[fnName] === 'function') {
            (window as any)[fnName]();
        } else {
            window.dispatchEvent(new CustomEvent(evtName));
        }
    };

    const handleStart = () => {
        callOrDispatch('__tourNavigateStart', 'tour:start');
        setState('running');
    };

    const handlePauseResume = () => {
        if (state === 'running') {
            callOrDispatch('__tourNavigatePause', 'tour:pause');
            setState('paused');
        } else if (state === 'paused') {
            callOrDispatch('__tourNavigateResume', 'tour:resume');
            setState('running');
        }
    };

    const handleBack = () => {
        show();
        requestAnimationFrame(() => router.back());
    };

    // Keep UI state in sync with any signals coming from the map
    useEffect(() => {
        const onStarted = () => setState('running');
        const onPaused = () => setState('paused');
        const onResumed = () => setState('running');
        const onStopped = () => setState('idle');

        window.addEventListener('tour:started', onStarted);
        window.addEventListener('tour:paused', onPaused);
        window.addEventListener('tour:resumed', onResumed);
        window.addEventListener('tour:stopped', onStopped);

        return () => {
            window.removeEventListener('tour:started', onStarted);
            window.removeEventListener('tour:paused', onPaused);
            window.removeEventListener('tour:resumed', onResumed);
            window.removeEventListener('tour:stopped', onStopped);
        };
    }, []);

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
            {/* Top-left Back button (change to right-3 to move it) */}
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
        </>
    );
}
