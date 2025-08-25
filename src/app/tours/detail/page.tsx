'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Timeline from '@/components/tour/Timeline';
import MapboxTourMap from '@/components/map/MapboxTourMap';
import NavLink from '@/components/nav/NavLink';
import { useAppSelector } from '@/lib/store/hook';
import { selectTourById } from '@/lib/store/slices/toursSlice';

export default function TourDetailsClientPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get('id') ?? '';

  // stable selector instance
  const selector = useMemo(() => selectTourById(id), [id]);
  const tour = useAppSelector(selector);

  // Client-only "not found"
  useEffect(() => {
    if (!id) router.replace('/tours-list'); // or wherever your list lives
    else if (!tour) router.replace('/404');
  }, [id, tour, router]);

  if (!id || !tour) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-xl">
        <div className="relative h-56 w-full sm:h-64">
          {tour.image ? (
            <Image
              src={tour.image}
              alt={tour.title}
              fill
              sizes="(max-width: 640px) 100vw, 1024px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
              <span className="text-sm">No image</span>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold text-white drop-shadow">
              {tour.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {tour.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">About this tour</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {tour.description}
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-sm">{new Date(tour.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Stops</div>
            <div className="text-sm">{tour.places.length}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Suggested gear</div>
            <div className="text-sm">Water, comfy shoes, sun protection</div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button size="lg" asChild>
          <NavLink href={`/tours/detail/navigation?id=${encodeURIComponent(id)}`}>
            Get Started
          </NavLink>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href="#timeline">Jump to Timeline</a>
        </Button>
      </div>

      {/* Map */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Map</h2>
        <MapboxTourMap places={tour.places} profile="walking" />
      </section>

      {/* Timeline */}
      <section id="timeline" className="space-y-4">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <Timeline places={tour.places} />
      </section>
    </div>
  );
}
