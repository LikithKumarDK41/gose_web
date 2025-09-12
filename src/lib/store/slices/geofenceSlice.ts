import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';

export type Checkin = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number;
    distance: number;
    tourId: string;
    blurb?: string;
    time?: string;
};

type GeofenceState = {
    /** placeId -> checked once already */
    checked: Record<string, boolean>;
    /** pending popups—toasts read from here */
    queue: Checkin[];
};

const initial: GeofenceState = {
    checked: {},
    queue: [],
};

const geofenceSlice = createSlice({
    name: 'geofence',
    initialState: initial,
    reducers: {
        markChecked(state, action: PayloadAction<string>) {
            state.checked[action.payload] = true;
        },
        enqueue(state, action: PayloadAction<Checkin>) {
            // avoid duplicates
            if (!state.queue.some(q => q.id === action.payload.id)) {
                state.queue.push(action.payload);
            }
        },
        dismiss(state, action: PayloadAction<string>) {
            state.queue = state.queue.filter(q => q.id !== action.payload);
        },
        confirm(state, action: PayloadAction<string>) {
            // app can handle confirmation side-effects elsewhere if needed
            state.queue = state.queue.filter(q => q.id !== action.payload);
        },
        resetAll(state) {
            state.checked = {};
            state.queue = [];
        },
    },
});

export const { markChecked, enqueue, dismiss, confirm, resetAll } = geofenceSlice.actions;
export default geofenceSlice.reducer;

// selectors
export const selectGeofenceQueue = (s: RootState) => s.geofence.queue;
export const selectGeofenceChecked = (s: RootState) => s.geofence.checked;
