'use client';

import { useMemo } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import {
  confirm,
  dismiss,
  selectGeofenceQueue,
} from '@/lib/store/slices/geofenceSlice';

/* -------------------- Types -------------------- */
type Checkin = ReturnType<typeof selectGeofenceQueue>[number];

type Cluster = {
  key: string;
  center: [number, number];
  items: Checkin[];
};

/* -------------------- Helpers -------------------- */
const MERGE_WITHIN_METERS = 60;
const metersBetween = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

/* -------------------- Component -------------------- */
export default function GlobalCheckinToasts() {
  const queue = useAppSelector(selectGeofenceQueue);
  const dispatch = useAppDispatch();

  const clusters = useMemo<Cluster[]>(() => {
    const result: Cluster[] = [];
    for (const p of queue) {
      const pt: [number, number] = [p.lng, p.lat];
      const idx = result.findIndex(
        (c) => metersBetween(c.center, pt) <= MERGE_WITHIN_METERS
      );
      if (idx >= 0) {
        result[idx] = { ...result[idx], items: [...result[idx].items, p] };
      } else {
        // use unique _key to avoid duplicates on reentry
        result.push({ key: p._key, center: pt, items: [p] });
      }
    }
    return result;
  }, [queue]);

  if (clusters.length === 0) return null;

  return (
    <>
      {/* ✅ Dim background overlay (click-through disabled) */}
      <div className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm" />

      {/* ✅ Toast cards container */}
      <div className="fixed left-1/2 top-1/2 z-[100] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 px-3">
        {clusters.map((cluster) => (
          <ToastCard
            key={cluster.key}
            cluster={cluster}
            onClose={() =>
              cluster.items.forEach((it) => dispatch(dismiss(it.id)))
            }
            onCheckin={(placeId) => {
              dispatch(confirm(placeId));
              dispatch(dismiss(placeId)); // ensure closes immediately
            }}
          />
        ))}
      </div>
    </>
  );
}

/* -------------------- Toast Card -------------------- */
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
  const widthClass = 'w-[min(92vw,28rem)]';

  return (
    <div
      className={`pointer-events-auto ${widthClass} rounded-xl border border-gray-300 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-black/85`}
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
                  key={it._key}
                  className="flex items-start justify-between rounded-lg border bg-background/50 p-3 dark:border-white/10"
                >
                  <div className="min-w-0 pr-3">
                    <div className="truncate font-medium">{it.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {it.blurb ?? 'Check in to mark this stop.'}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      ~{Math.round(it.distance)} m • radius {it.radius} m
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

/* -------------------- Single Place Card -------------------- */
function SinglePlace({
  item,
  onCheckin,
}: {
  item: Checkin;
  onCheckin: () => void;
}) {
  return (
    <div className="mt-1">
      <div className="mt-1 text-xs text-muted-foreground">
        {item.blurb ?? 'You’ve entered the check-in area.'}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        ~{Math.round(item.distance)} m • radius {item.radius} m
      </div>
      <div className="mt-3">
        <Button
          size="sm"
          className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          onClick={onCheckin}
        >
          Check in
        </Button>
      </div>
    </div>
  );
}
