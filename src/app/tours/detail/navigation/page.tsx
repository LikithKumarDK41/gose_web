'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MapboxTourMapNavigation from '@/components/map/MapboxTourMapNavigation';
import NavigationOverlay from '@/components/map/NavigationOverlay';
import { useAppSelector } from '@/lib/store/hook';
import { selectTourById } from '@/lib/store/slices/toursSlice';

export default function NavigationPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get('id') ?? '';

  const selector = useMemo(() => selectTourById(id), [id]);
  const tour = useAppSelector(selector);

  useEffect(() => {
    if (!id) router.replace('/tours-list');
    else if (!tour) router.replace('/404');
  }, [id, tour, router]);

  if (!id || !tour) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <MapboxTourMapNavigation places={tour.places} profile="walking" height="100vh" />
      <NavigationOverlay tourId={tour.id} places={tour.places} defaultProfile="walking" />
    </div>
  );
}
