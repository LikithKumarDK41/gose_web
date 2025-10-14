// src/lib/store/slices/geofenceSlice.ts
import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import { RootState } from '@/lib/store';

/* ---------- Types ---------- */
export type GeofencePlace = {
    id: string;          // place/monument id
    name: string;
    lat: number;
    lng: number;
    radius?: number;     // meters (default applied if missing)
    blurb?: string;
    tourId?: string | null;
};

export type QueueItem = {
    id: string;          // place id (stable key for confirm)
    name: string;
    lat: number;
    lng: number;
    radius: number;
    distance: number;    // meters
    tourId?: string | null;
    blurb?: string;
    _key: string;        // internal (unique popup instance)
};

type GeofenceState = {
    queue: QueueItem[]; // active popups
    inside: Record<string, { armed: boolean; tourId?: string | null }>;
    last: { lat: number; lng: number } | null;
    checked: Record<string, boolean>; // ✅ visited / checked-in places
    defaults: { radius: number; rearmFactor: number };
};

/* ---------- Initial ---------- */
const initialState: GeofenceState = {
    queue: [],
    inside: {},
    last: null,
    checked: {}, // ✅ initially none checked
    defaults: { radius: 60, rearmFactor: 1.25 },
};

/* ---------- Helpers ---------- */
function haversine(a: [number, number], b: [number, number]) {
    const R = 6371000; // Earth radius in meters
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

/* ---------- Slice ---------- */
const geofenceSlice = createSlice({
    name: 'geofence',
    initialState,
    reducers: {
        /** called on each GPS update */
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
            state.last = { lat, lng };

            for (const p of places) {
                const radius = p.radius ?? state.defaults.radius;

                const dist = haversine([lng, lat], [p.lng, p.lat]);
                const key = `${tourId || 'none'}::${p.id}`;
                const status = state.inside[key];

                console.log(
                    "🛰️ GeoTick:",
                    "Place:", p.name,
                    "Dist:", dist.toFixed(1),
                    "Radius:", radius,
                    "Armed:", status?.armed
                );

                // Re-arm logic
                if (!status) {
                    if (dist <= radius) {
                        state.queue.push({
                            id: p.id,
                            name: p.name,
                            lat: p.lat,
                            lng: p.lng,
                            radius,
                            distance: dist,
                            tourId,
                            blurb: p.blurb,
                            _key: nanoid(),
                        });
                        state.inside[key] = { armed: false, tourId };
                    } else {
                        state.inside[key] = { armed: true, tourId };
                    }
                } else if (status.armed && dist <= radius) {
                    state.queue.push({
                        id: p.id,
                        name: p.name,
                        lat: p.lat,
                        lng: p.lng,
                        radius,
                        distance: dist,
                        tourId,
                        blurb: p.blurb,
                        _key: nanoid(),
                    });
                    state.inside[key] = { armed: false, tourId };
                } else if (!status.armed && dist >= radius * state.defaults.rearmFactor) {
                    state.inside[key] = { armed: true, tourId };
                }
            }
        },

        /** user taps "Check in" */
        confirm(state, action: PayloadAction<string /* placeId */>) {
            const id = action.payload;
            state.queue = state.queue.filter((q) => q.id !== id);
            state.checked[id] = true; // ✅ mark as checked
        },

        /** user closes popup (dismiss only) */
        dismiss(state, action: PayloadAction<string /* placeId */>) {
            const id = action.payload;
            state.queue = state.queue.filter((q) => q.id !== id);
        },

        /** wipe all geofence data */
        resetAll(state) {
            state.queue = [];
            state.inside = {};
            state.last = null;
            state.checked = {};
        },
    },
});

/* ---------- Exports ---------- */
export const { locationTick, confirm, dismiss, resetAll } =
    geofenceSlice.actions;

/** Active toast queue (nearby places) */
export const selectGeofenceQueue = (s: RootState) =>
    (s.geofence as GeofenceState).queue;

/** ✅ Checked-in places map (used in /tours/page.tsx) */
export const selectGeofenceChecked = (s: RootState) =>
    (s.geofence as GeofenceState).checked;

export default geofenceSlice.reducer;
