'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalLoader } from '@/components/system/LoaderProvider';
import { useTourNav } from '@/providers/TourNavProvider';
import type { Place } from '@/lib/data/tours';

type Props = {
  tourId?: string;
  places?: Place[];
  defaultProfile?: 'walking' | 'driving' | 'cycling';
};

export default function NavigationOverlay({ tourId, places, defaultProfile = 'walking' }: Props) {
  const router = useRouter();
  const { show } = useGlobalLoader();
  const nav = useTourNav();

  const handleStart = () => {
    if (nav.activeTour) {
      nav.resume();
      return;
    }
    // start with provided props (from the nav page)
    if (tourId && places?.length) {
      nav.start(tourId, places, defaultProfile);
    } else {
      // fallback: just resume if map is already ready
      nav.resume();
    }
  };

  const handlePauseResume = () => {
    if (nav.status === 'running') nav.pause();
    else if (nav.status === 'paused') nav.resume();
  };

  const handleBack = () => {
    show();
    requestAnimationFrame(() => router.back());
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
        {nav.status === 'idle' && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg"
            onClick={handleStart}
            aria-label="Start navigation"
          >
            <Play className="mr-2 h-5 w-5" />
            Start
          </Button>
        )}
        {nav.status === 'running' && (
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
        )}
        {nav.status === 'paused' && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg"
            onClick={handlePauseResume}
            aria-label="Resume navigation"
          >
            <Play className="mr-2 h-5 w-5" />
            Resume
          </Button>
        )}
      </div>
    </>
  );
}
