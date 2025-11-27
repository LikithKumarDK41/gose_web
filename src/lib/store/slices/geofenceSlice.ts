import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

import type { QueueItem } from "@/lib/types/userTour.types";

export interface LocationState {
  last: { lat: number; lng: number } | null;
  queue: QueueItem[];
}

const initialState: LocationState = {
  last: null,
  queue: [],
};

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

const geofenceSlice = createSlice({
  name: "geofence",
  initialState,
  reducers: {
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
            monumentId: p.monumentId,
            tourpointId: p.tourpointId ?? p.id,
            tourId: p.tourId,
          });
        }
      }
    },

    confirm(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((q) => q.id !== action.payload);
    },

    clearQueue(state) {
      state.queue = [];
    },

    resetAll(state) {
      state.last = null;
      state.queue = [];
    },
  },
});

export const { locationTick, confirm, clearQueue, resetAll } =
  geofenceSlice.actions;

export const selectGeofenceLast = (s: RootState) => s.geofence.last;
export const selectGeofenceQueue = (s: RootState) => s.geofence.queue;

export default geofenceSlice.reducer;
