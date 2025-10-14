'use client';

import { useEffect } from 'react';
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
import { useLocale } from '@/providers/LocaleProvider';

/* -------------------- Props -------------------- */
type Props = {
  tourId?: string;
  defaultProfile?: 'walking' | 'driving' | 'cycling';
  autoStart?: boolean;
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

  /* ----------------------------------------------------------------
     ✅ 1. Restore navigation state on reload
     ---------------------------------------------------------------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('navState');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.status === 'running' && parsed?.tourId) {
          dispatch(setActiveTour(parsed.tourId));
          dispatch(setProfile(parsed.profile ?? defaultProfile));
          dispatch(navStart());
        } else if (parsed?.status === 'paused' && parsed?.tourId) {
          dispatch(setActiveTour(parsed.tourId));
          dispatch(setProfile(parsed.profile ?? defaultProfile));
          dispatch(navPause());
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to restore nav state:', err);
    }
  }, [dispatch, defaultProfile]);

  /* ----------------------------------------------------------------
     ✅ 2. Persist state changes (so reload keeps running)
     ---------------------------------------------------------------- */
  useEffect(() => {
    if (nav.status === 'idle') {
      localStorage.removeItem('navState');
    } else {
      localStorage.setItem(
        'navState',
        JSON.stringify({
          status: nav.status,
          tourId: nav.activeTourId,
          profile: nav.profile,
        })
      );
    }
  }, [nav.status, nav.activeTourId, nav.profile]);

  /* ----------------------------------------------------------------
     ✅ 3. Optional Auto Start when entering page
     ---------------------------------------------------------------- */
  useEffect(() => {
    if (autoStart && nav.status === 'idle' && tourId) {
      dispatch(setActiveTour(tourId));
      dispatch(setProfile(defaultProfile));
      dispatch(navStart());
    }
  }, [autoStart, nav.status, tourId, defaultProfile, dispatch]);

  /* ----------------------------------------------------------------
     ✅ 4. Control Handlers
     ---------------------------------------------------------------- */
  const handleStart = () => {
    if (tourId) dispatch(setActiveTour(tourId));
    dispatch(setProfile(defaultProfile));
    dispatch(navStart());
  };

  const handlePauseResume = () => {
    if (nav.status === 'running') {
      dispatch(navPause());
    } else if (nav.status === 'paused') {
      dispatch(navResume());
    }
  };

  const handleStop = () => {
    dispatch(navStop());
    dispatch(resetGeofence());
    localStorage.removeItem('navState');
  };

  const handleBack = () => {
    show();
    dispatch(navStop());
    dispatch(resetGeofence());
    localStorage.removeItem('navState');
    requestAnimationFrame(() => router.back());
  };

  /* ----------------------------------------------------------------
     ✅ 5. Localized labels
     ---------------------------------------------------------------- */
  const labels = {
    back: t('Back') || (locale === 'ja' ? '戻る' : 'Back'),
    start: t('Start') || (locale === 'ja' ? '開始' : 'Start'),
    pause: t('Pause') || (locale === 'ja' ? '一時停止' : 'Pause'),
    resume: t('Resume') || (locale === 'ja' ? '再開' : 'Resume'),
    stop: t('Stop') || (locale === 'ja' ? '停止' : 'Stop'),
  };

  /* ----------------------------------------------------------------
     ✅ 6. Render UI
     ---------------------------------------------------------------- */
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

      {/* 🎯 Bottom Navigation Controls */}
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
