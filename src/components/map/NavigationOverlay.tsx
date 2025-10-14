'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, StopCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalLoader } from '@/providers/LoaderProvider';
import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import {
  selectNav,
  start as navStart,
  pause as navPause,
  resume as navResume,
  stop as navStop,
  setProfile,
} from '@/lib/store/slices/navSlice';
import { resetAll as resetGeofence } from '@/lib/store/slices/geofenceSlice';
import { setActiveTour } from '@/lib/store/slices/toursSlice';
import type { Place } from '@/lib/data/tourTypes';
import { useLocale } from '@/providers/LocaleProvider';

/* -------------------- Props -------------------- */
type Props = {
  tourId?: string;
  places?: Place[];
  defaultProfile?: 'walking' | 'driving' | 'cycling';
  autoStart?: boolean; // optional prop to auto start navigation
};

/* -------------------- Component -------------------- */
export default function NavigationOverlay({
  tourId,
  defaultProfile = 'walking',
  autoStart = false,
}: Props) {
  const router = useRouter();
  const { show } = useGlobalLoader();
  const nav = useAppSelector(selectNav);
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();

  /* -------------------- Lifecycle Auto Start -------------------- */
  // optional auto start when entering navigation page
  if (autoStart && nav.status === 'idle' && tourId) {
    dispatch(setActiveTour(tourId));
    dispatch(setProfile(defaultProfile));
    dispatch(navStart());
  }

  /* -------------------- Handlers -------------------- */
  const handleStart = () => {
    if (tourId) dispatch(setActiveTour(tourId));
    dispatch(setProfile(defaultProfile));
    dispatch(navStart());
  };

  const handlePauseResume = () => {
    if (nav.status === 'running') dispatch(navPause());
    else if (nav.status === 'paused') dispatch(navResume());
  };

  const handleStop = () => {
    dispatch(navStop());
    dispatch(resetGeofence());
  };

  const handleBack = () => {
    show(); // show loader for smooth transition
    dispatch(navStop());
    dispatch(resetGeofence());
    requestAnimationFrame(() => router.back());
  };

  /* -------------------- Localized labels -------------------- */
  const labels = {
    back: t('Back') || (locale === 'ja' ? '戻る' : 'Back'),
    start: t('Start') || (locale === 'ja' ? '開始' : 'Start'),
    pause: t('Pause') || (locale === 'ja' ? '一時停止' : 'Pause'),
    resume: t('Resume') || (locale === 'ja' ? '再開' : 'Resume'),
    stop: t('Stop') || (locale === 'ja' ? '停止' : 'Stop'),
  };

  /* -------------------- Render -------------------- */
  return (
    <>
      {/* 🔙 Back Button */}
      <div className="fixed left-3 top-3 z-[60]">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full shadow bg-white/80 dark:bg-black/50 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-black/60"
          onClick={handleBack}
          aria-label={labels.back}
          title={labels.back}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* 🎯 Navigation Controls (Bottom Center) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center gap-3">
        {nav.status === 'idle' && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
            onClick={handleStart}
            aria-label={labels.start}
          >
            <Play className="mr-2 h-5 w-5" /> {labels.start}
          </Button>
        )}

        {nav.status === 'running' && (
          <>
            <Button
              size="lg"
              variant="outline"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-white/80 dark:bg-black/40 backdrop-blur-sm"
              onClick={handlePauseResume}
              aria-label={labels.pause}
            >
              <Pause className="mr-2 h-5 w-5" /> {labels.pause}
            </Button>

            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
              onClick={handleStop}
              aria-label={labels.stop}
            >
              <StopCircle className="mr-2 h-5 w-5" /> {labels.stop}
            </Button>
          </>
        )}

        {nav.status === 'paused' && (
          <>
            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              onClick={handlePauseResume}
              aria-label={labels.resume}
            >
              <Play className="mr-2 h-5 w-5" /> {labels.resume}
            </Button>

            <Button
              size="lg"
              className="pointer-events-auto rounded-full px-6 shadow-lg bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
              onClick={handleStop}
              aria-label={labels.stop}
            >
              <StopCircle className="mr-2 h-5 w-5" /> {labels.stop}
            </Button>
          </>
        )}
      </div>
    </>
  );
}
