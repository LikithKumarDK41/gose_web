'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, X } from 'lucide-react';

type CheckinDetail = {
  id: string;
  name: string;
  blurb?: string;
  time?: string;
  lat: number;
  lng: number;
  radius: number;
  distance: number;
};

export default function GlobalCheckinBanner() {
  const [checkin, setCheckin] = useState<CheckinDetail | null>(null);

  useEffect(() => {
    const onCheckin = (e: Event) => {
      const ce = e as CustomEvent<CheckinDetail>;
      setCheckin(ce.detail);
    };
    window.addEventListener('tour:checkin', onCheckin);
    return () => window.removeEventListener('tour:checkin', onCheckin);
  }, []);

  if (!checkin) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
      <div className="max-w-md w-full rounded-xl border bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">You’re near: {checkin.name}</div>
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
                onClick={() => setCheckin(null)}
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
  );
}
