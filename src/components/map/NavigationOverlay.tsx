'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalLoader } from '@/providers/LoaderProvider';
import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import { selectNav, start as navStart, pause as navPause, resume as navResume, setProfile } from '@/lib/store/slices/navSlice';
import { setActiveTour } from '@/lib/store/slices/toursSlice';
import type { Place } from '@/lib/data/tourTypes';

// use your app's locale provider
import { useLocale } from '@/providers/LocaleProvider';

type Props = {
  tourId?: string;
  places?: Place[]; // kept for parity
  defaultProfile?: 'walking' | 'driving' | 'cycling';
};

export default function NavigationOverlay({ tourId, defaultProfile = 'walking' }: Props) {
  const router = useRouter();
  const { show } = useGlobalLoader();
  const nav = useAppSelector(selectNav);
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale(); // useLocale provides t() and locale

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
        <Button
          size="icon"
          className="rounded-full shadow"
          onClick={handleBack}
          aria-label={t('Back') || 'Back'}
          title={t('Back') || 'Back'}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center">
        {nav.status === 'idle' && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg"
            onClick={handleStart}
            aria-label={t('Start navigation') || 'Start navigation'}
          >
            <Play className="mr-2 h-5 w-5" /> {t('Start') || 'Start'}
          </Button>
        )}
        {nav.status === 'running' && (
          <Button
            size="lg"
            variant="outline"
            className="pointer-events-auto rounded-full px-6 shadow-lg"
            onClick={handlePauseResume}
            aria-label={t('Pause navigation') || 'Pause navigation'}
          >
            <Pause className="mr-2 h-5 w-5" /> {t('Pause') || 'Pause'}
          </Button>
        )}
        {nav.status === 'paused' && (
          <Button
            size="lg"
            className="pointer-events-auto rounded-full px-6 shadow-lg"
            onClick={handlePauseResume}
            aria-label={t('Resume navigation') || 'Resume navigation'}
          >
            <Play className="mr-2 h-5 w-5" /> {t('Resume') || 'Resume'}
          </Button>
        )}
      </div>
    </>
  );
}
