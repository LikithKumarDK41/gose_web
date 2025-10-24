import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";
import { RootState } from "../index";

/* ----------------------------------------------------------------
   🗺️ Types
---------------------------------------------------------------- */
export interface GeofencePlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  blurb?: string;
  tourId?: string | null;
}

export interface QueueItem extends GeofencePlace {
  distance: number;
  _key: string;
}

interface GeofenceState {
  /** Pending check-ins to show as toasts */
  queue: QueueItem[];

  /** Track which locations are inside or armed */
  inside: Record<string, { armed: boolean; tourId?: string | null }>;

  /** Last GPS coordinate */
  last: { lat: number; lng: number } | null;

  /** Record of monuments the user has already checked into */
  checked: Record<string, boolean>;

  /** Default factors (used to re-arm geofence) */
  defaults: { rearmFactor: number };
}

/* ----------------------------------------------------------------
   ⚙️ Initial State
---------------------------------------------------------------- */
const initialState: GeofenceState = {
  queue: [],
  inside: {},
  last: null,
  checked: {},
  defaults: { rearmFactor: 1.25 },
};

/* ----------------------------------------------------------------
   🧮 Helpers
---------------------------------------------------------------- */
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000; // meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const MIN_DISTANCE_CHANGE = 10; // meters before recalculation

/* ----------------------------------------------------------------
   🧩 Slice
---------------------------------------------------------------- */
const geofenceSlice = createSlice({
  name: "geofence",
  initialState,
  reducers: {
    locationTick(
      state,
      action: PayloadAction<{
        lat: number;
        lng: number;
        places: GeofencePlace[];
        tourId?: string | null;
      }>
    ) {
      const { lat, lng, places, tourId } = action.payload;

      // Skip update if movement is too small
      if (
        state.last &&
        haversine([state.last.lng, state.last.lat], [lng, lat]) < MIN_DISTANCE_CHANGE
      ) {
        return;
      }
      state.last = { lat, lng };

      for (const p of places) {
        const dist = haversine([lng, lat], [p.lng, p.lat]);
        const key = `${tourId || "none"}::${p.id}`;
        const status = state.inside[key];
        const rearmFactor = state.defaults.rearmFactor;

        // Skip if already queued
        if (state.queue.some((q) => q.id === p.id)) continue;

        // Enter region first time
        if (!status) {
          if (dist <= p.radius) {
            state.queue.push({ ...p, distance: dist, _key: nanoid() });
            state.inside[key] = { armed: false, tourId };
            console.log("🎯 Entered region:", p.name);
          } else {
            state.inside[key] = { armed: true, tourId };
          }
        }
        // Re-enter after being armed
        else if (status.armed && dist <= p.radius) {
          state.queue.push({ ...p, distance: dist, _key: nanoid() });
          state.inside[key] = { armed: false, tourId };
          console.log("🔁 Re-entered:", p.name);
        }
        // Leave region far enough → re-arm
        else if (!status.armed && dist >= p.radius * rearmFactor) {
          state.inside[key] = { armed: true, tourId };
        }
      }
    },

    /** User confirms a check-in */
    confirm(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.queue = state.queue.filter((q) => q.id !== id);
      state.checked[id] = true;
    },

    /** User dismisses a toast */
    dismiss(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.queue = state.queue.filter((q) => q.id !== id);
    },

    /** Clear queue (after showing toasts) */
    clearQueue(state) {
      state.queue = [];
    },

    /** ✅ Reset entire geofence state */
    resetAll(state) {
      state.queue = [];
      state.inside = {};
      state.last = null;
      state.checked = {};
    },
  },
});

/* ----------------------------------------------------------------
   📤 Exports
---------------------------------------------------------------- */
export const { locationTick, confirm, dismiss, clearQueue, resetAll } =
  geofenceSlice.actions;

export const selectGeofenceQueue = (s: RootState): QueueItem[] => s.geofence.queue;
export const selectGeofenceChecked = (s: RootState): Record<string, boolean> =>
  s.geofence.checked;

export default geofenceSlice.reducer;
