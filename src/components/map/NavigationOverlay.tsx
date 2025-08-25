'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalLoader } from '@/providers/LoaderProvider';
import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import { selectNav, start as navStart, pause as navPause, resume as navResume, setProfile } from '@/lib/store/slices/navSlice';
import { setActiveTour } from '@/lib/store/slices/toursSlice';
import type { Place } from '@/lib/data/tourTypes';

type Props = {
  tourId?: string;
  places?: Place[]; // not needed for Redux itself, kept for parity
  defaultProfile?: 'walking' | 'driving' | 'cycling';
};

export default function NavigationOverlay({ tourId, defaultProfile = 'walking' }: Props) {
  const router = useRouter();
  const { show } = useGlobalLoader();
  const nav = useAppSelector(selectNav);
  const dispatch = useAppDispatch();

  const handleStart = () => {
    if (tourId) dispatch(setActiveTour(tourId));
    dispatch(setProfile(defaultProfile));
    dispatch(navStart());
  };

  const handlePauseResume = () => {
    if (nav.status === 'running') dispatch(navPause());
    else if (nav.status === 'paused') dispatch(navResume());
  };

  const handleBack = () => {
    show();
    requestAnimationFrame(() => router.back());
  };

  return (
    <>
      <div className="fixed left-3 top-3 z-[60]">
        <Button size="icon" className="rounded-full shadow" onClick={handleBack} aria-label="Back" title="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center">
        {nav.status === 'idle' && (
          <Button size="lg" className="pointer-events-auto rounded-full px-6 shadow-lg" onClick={handleStart} aria-label="Start navigation">
            <Play className="mr-2 h-5 w-5" /> Start
          </Button>
        )}
        {nav.status === 'running' && (
          <Button size="lg" variant="outline" className="pointer-events-auto rounded-full px-6 shadow-lg" onClick={handlePauseResume} aria-label="Pause navigation">
            <Pause className="mr-2 h-5 w-5" /> Pause
          </Button>
        )}
        {nav.status === 'paused' && (
          <Button size="lg" className="pointer-events-auto rounded-full px-6 shadow-lg" onClick={handlePauseResume} aria-label="Resume navigation">
            <Play className="mr-2 h-5 w-5" /> Resume
          </Button>
        )}
      </div>
    </>
  );
}
