// src/components/nav/GlobalCheckinToasts.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Incoming event shape from GeofenceProvider
export type CheckinDetail = {
  id: string;
  name: string;
  blurb?: string;
  time?: string;
  lat: number;
  lng: number;
  radius: number;   // meters
  distance: number; // meters at trigger time
};

// Small helper (meters)
function haversine(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]), lat2 = toRad(b[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// A cluster groups multiple nearby check-in candidates
type Cluster = {
  key: string;              // unique for React
  center: [number, number]; // lng, lat
  items: CheckinDetail[];   // one or many places in this area
};

const MERGE_WITHIN_METERS = 60; // cluster if geofences are ~60m apart

export default function GlobalCheckinToasts() {
  const [clusters, setClusters] = useState<Cluster[]>([]);

  // Listen globally for geofence events
  useEffect(() => {
    const onCheckin = (e: Event) => {
      const ce = e as CustomEvent<CheckinDetail>;
      const p = ce.detail;
      const pt: [number, number] = [p.lng, p.lat];

      setClusters((prev) => {
        // If this place already exists in a cluster, ignore duplicates
        for (const c of prev) {
          if (c.items.some((it) => it.id === p.id)) return prev;
        }

        // Try to merge with an existing cluster by distance
        const i = prev.findIndex(
          (c) => haversine(c.center, pt) <= MERGE_WITHIN_METERS
        );

        if (i >= 0) {
          const copy = [...prev];
          copy[i] = { ...copy[i], items: [...copy[i].items, p] };
          return copy;
        }

        // Otherwise create a new cluster
        return [...prev, { key: `${p.id}-${Date.now()}`, center: pt, items: [p] }];
      });
    };

    window.addEventListener('tour:checkin', onCheckin);
    return () => window.removeEventListener('tour:checkin', onCheckin);
  }, []);

  if (clusters.length === 0) return null;

  return (
    <>
      {/* Background overlay (visual only; doesn't block clicks under it) */}
      <div className="pointer-events-none fixed inset-0 z-[99]">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm dark:bg-black/60" />
      </div>

      {/* Centered stack (multiple clusters possible) */}
      <div className="pointer-events-none fixed left-1/2 top-1/2 z-[100] -translate-x-1/2 -translate-y-1/2 space-y-3 p-3">
        {clusters.map((cluster) => (
          <ToastCard
            key={cluster.key}
            cluster={cluster}
            onClose={() =>
              setClusters((prev) => prev.filter((c) => c.key !== cluster.key))
            }
            onCheckin={(placeId) => {
              // Fire a confirmation event you can handle globally
              window.dispatchEvent(
                new CustomEvent('tour:checkin:confirm', { detail: { id: placeId } })
              );
              // Remove only that place from the cluster; drop the cluster if empty
              setClusters((prev) => {
                const copy = prev.map((c) =>
                  c.key === cluster.key
                    ? { ...c, items: c.items.filter((i) => i.id !== placeId) }
                    : c
                );
                return copy.filter((c) => c.items.length > 0);
              });
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ---------- Presentation ---------- */

function ToastCard({
  cluster,
  onClose,
  onCheckin,
}: {
  cluster: Cluster;
  onClose: () => void;
  onCheckin: (placeId: string) => void;
}) {
  const multiple = cluster.items.length > 1;
  const title = multiple
    ? `You're near multiple places`
    : `You're near: ${cluster.items[0].name}`;

  // Keep UI compact on phones while staying centered
  const widthClass = useMemo(() => 'w-[min(92vw,28rem)]', []);

  return (
    <div
      className={`pointer-events-auto ${widthClass} rounded-xl border bg-white/95 p-4 shadow-xl backdrop-blur dark:border-white/10 dark:bg-black/85`}
      role="dialog"
      aria-modal="false"
    >
      <div className="flex items-start gap-3">
        <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{title}</div>

          {!multiple && (
            <SinglePlace
              item={cluster.items[0]}
              onCheckin={() => onCheckin(cluster.items[0].id)}
            />
          )}

          {multiple && (
            <div className="mt-2 max-h-72 space-y-2 overflow-auto pr-1">
              {cluster.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-start justify-between rounded-lg border bg-background/50 p-3 dark:border-white/10"
                >
                  <div className="min-w-0 pr-3">
                    <div className="truncate font-medium">{it.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {it.blurb ?? 'Check in to mark this stop.'}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      ~{Math.max(0, Math.round(it.distance))} m inside • radius {it.radius} m
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => onCheckin(it.id)}
                  >
                    Check in
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="ml-2 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SinglePlace({
  item,
  onCheckin,
}: {
  item: CheckinDetail;
  onCheckin: () => void;
}) {
  return (
    <div className="mt-1">
      <div className="mt-1 text-xs text-muted-foreground">
        {item.blurb ?? 'You’ve entered the check-in area.'}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        ~{Math.max(0, Math.round(item.distance))} m inside • radius {item.radius} m
      </div>
      <div className="mt-3">
        <Button size="sm" className="rounded-full" onClick={onCheckin}>
          Check in
        </Button>
      </div>
    </div>
  );
}
