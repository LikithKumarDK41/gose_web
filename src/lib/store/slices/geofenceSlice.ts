import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

/* ============================================================
   TYPES
============================================================ */

export interface QueueItem {
  id: string;                    // tourpoint ID
  name: string;

  lat: number;
  lng: number;
  radius: number;

  blurb?: string;

  /* ⭐ NEW — required for Stamp API */
  monumentId: string | null;
  tourpointId: string | null;
  tourId: string | null;
}

export interface LocationState {
  last: { lat: number; lng: number } | null;
  queue: QueueItem[];
}

/* ============================================================
   INITIAL STATE
============================================================ */
const initialState: LocationState = {
  last: null,
  queue: [],
};

/* ============================================================
   HELPERS
============================================================ */
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const s =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/* ============================================================
   SLICE
============================================================ */

const geofenceSlice = createSlice({
  name: "geofence",
  initialState,
  reducers: {
    /* ------------------------------------------------------
       LOCATION UPDATE (called every GeoWatcher tick)
    ------------------------------------------------------ */
    locationTick(
      state,
      action: PayloadAction<{
        lat: number;
        lng: number;
        places: {
          id: string;
          name: string;
          lat: number;
          lng: number;
          radius: number;
          blurb?: string;
          monumentId: string | null;
          tourpointId: string | null;
          tourId: string | null;
        }[];
        tourId: string | null;
      }>
    ) {
      const { lat, lng, places } = action.payload;

      state.last = { lat, lng };

      if (!places.length) return;

      for (const p of places) {
        const d = distanceMeters({ lat, lng }, { lat: p.lat, lng: p.lng });

        // Already queued? skip
        const alreadyQueued = state.queue.some((q) => q.id === p.id);
        if (alreadyQueued) continue;

        if (d <= p.radius) {
          state.queue.push({
            id: p.id,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            radius: p.radius,
            blurb: p.blurb,

            /* ⭐ Stamp required fields */
            monumentId: p.monumentId,
            tourpointId: p.tourpointId ?? p.id,
            tourId: p.tourId,
          });
        }
      }
    },

    /* ------------------------------------------------------
       CONFIRM CHECK-IN for a given ID
    ------------------------------------------------------ */
    confirm(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((q) => q.id !== action.payload);
    },

    /* ------------------------------------------------------
       CLEAR all queued triggers
    ------------------------------------------------------ */
    clearQueue(state) {
      state.queue = [];
    },

    /* ------------------------------------------------------
       RESET tracking when tour ends
    ------------------------------------------------------ */
    resetAll(state) {
      state.last = null;
      state.queue = [];
    },
  },
});

/* ============================================================
   EXPORTS
============================================================ */
export const { locationTick, confirm, clearQueue, resetAll } =
  geofenceSlice.actions;

export const selectGeofenceLast = (s: RootState) => s.geofence.last;
export const selectGeofenceQueue = (s: RootState) => s.geofence.queue;

export default geofenceSlice.reducer;
